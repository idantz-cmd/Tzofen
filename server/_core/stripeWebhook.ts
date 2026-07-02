/**
 * Stripe webhook handler.
 *
 * Mounted with express.raw (NOT json) because signature verification needs the
 * exact raw request bytes. Every event is signature-verified and de-duplicated
 * via the webhook_events table before processing, so retried deliveries are safe.
 */
import express, { type Express, type Request, type Response } from "express";
import Stripe from "stripe";
import { ENV } from "./env";
import { getStripe, isStripeConfigured, priceToPlan } from "../services/stripe";
import * as db from "../db";

// Subscription statuses that grant paid access. past_due keeps access during
// Stripe's retry window; everything else revokes to free.
const ACCESS_STATUSES = new Set(["active", "trialing", "past_due"]);

async function syncSubscription(sub: Stripe.Subscription) {
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user = await db.getUserByStripeCustomerId(customerId);
  if (!user) {
    console.warn(`[stripe] subscription ${sub.id}: no user for customer ${customerId}`);
    return;
  }

  const priceId = sub.items.data[0]?.price?.id ?? null;
  const mapped = priceToPlan(priceId);
  const plan = mapped?.plan ?? "pro";
  // current_period_end is unix seconds; cast guards against SDK type drift.
  const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;

  await db.upsertSubscription({
    userId: user.id,
    stripeSubscriptionId: sub.id,
    stripeCustomerId: customerId,
    plan,
    status: sub.status,
    priceId,
    interval: mapped?.interval ?? null,
    currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
  });

  const grants = ACCESS_STATUSES.has(sub.status);
  await db.setUserPlan(user.id, grants ? plan : "free");
}

async function recordInvoice(invoice: Stripe.Invoice, status: "paid" | "failed") {
  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  const user = customerId ? await db.getUserByStripeCustomerId(customerId) : null;
  const amount = status === "paid" ? invoice.amount_paid : invoice.amount_due;
  const paymentIntent = (invoice as unknown as { payment_intent?: string | { id: string } })
    .payment_intent;

  await db.recordTransaction({
    userId: user?.id ?? null,
    stripeInvoiceId: invoice.id ?? null,
    stripePaymentIntentId:
      typeof paymentIntent === "string" ? paymentIntent : paymentIntent?.id ?? null,
    amount: amount ?? 0,
    currency: invoice.currency ?? "ils",
    status,
    description: invoice.lines?.data[0]?.description ?? (status === "paid" ? "תשלום מנוי" : "תשלום נכשל"),
    invoiceUrl: invoice.hosted_invoice_url ?? null,
  });
}

async function recordRefund(charge: Stripe.Charge) {
  const customerId =
    typeof charge.customer === "string" ? charge.customer : charge.customer?.id;
  const user = customerId ? await db.getUserByStripeCustomerId(customerId) : null;

  await db.recordTransaction({
    userId: user?.id ?? null,
    stripePaymentIntentId:
      typeof charge.payment_intent === "string"
        ? charge.payment_intent
        : charge.payment_intent?.id ?? null,
    amount: -(charge.amount_refunded ?? 0),
    currency: charge.currency ?? "ils",
    status: "refunded",
    description: "החזר כספי",
    invoiceUrl: charge.receipt_url ?? null,
  });
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const subId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      if (subId) {
        const sub = await getStripe().subscriptions.retrieve(subId);
        await syncSubscription(sub);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
    case "invoice.paid":
      await recordInvoice(event.data.object as Stripe.Invoice, "paid");
      break;
    case "invoice.payment_failed":
      await recordInvoice(event.data.object as Stripe.Invoice, "failed");
      break;
    case "charge.refunded":
      await recordRefund(event.data.object as Stripe.Charge);
      break;
    default:
      // Unhandled event types are acknowledged (200) and ignored.
      break;
  }
}

export function registerStripeWebhook(app: Express) {
  app.post(
    "/api/stripe/webhook",
    // Raw body parser scoped to this route — signature verification needs the
    // exact bytes, so this must be registered before the global express.json().
    express.raw({ type: "application/json" }),
    async (req: Request, res: Response) => {
      if (!isStripeConfigured() || !ENV.stripe.webhookSecret) {
        res.status(503).json({ error: "billing not configured" });
        return;
      }

      const sig = req.headers["stripe-signature"];
      if (!sig) {
        res.status(400).json({ error: "missing signature" });
        return;
      }

      let event: Stripe.Event;
      try {
        event = getStripe().webhooks.constructEvent(
          req.body as Buffer,
          sig,
          ENV.stripe.webhookSecret
        );
      } catch (err) {
        console.error("[stripe] signature verification failed:", (err as Error).message);
        res.status(400).json({ error: "invalid signature" });
        return;
      }

      // Idempotency: skip events we've already processed.
      try {
        if (await db.isWebhookEventProcessed(event.id)) {
          res.json({ received: true, duplicate: true });
          return;
        }
        await handleEvent(event);
        await db.markWebhookEventProcessed(event.id, event.type);
      } catch (err) {
        console.error(`[stripe] error handling ${event.type}:`, err);
        // 500 → Stripe retries later.
        res.status(500).json({ error: "handler error" });
        return;
      }

      res.json({ received: true });
    }
  );
}
