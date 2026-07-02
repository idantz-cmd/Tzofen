import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import {
  getStripe,
  isStripeConfigured,
  getPriceId,
  PLAN_CATALOG,
} from "../services/stripe";
import * as db from "../db";

const PAID_PLAN = z.enum(["pro", "champion"]);
const INTERVAL = z.enum(["month", "year"]);

/** Get or create the Stripe customer for a user and persist its id. */
async function ensureStripeCustomer(user: {
  id: number;
  email: string;
  name: string;
  stripeCustomerId: string | null;
}): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: String(user.id) },
  });
  await db.setStripeCustomerId(user.id, customer.id);
  return customer.id;
}

export const billingRouter = router({
  // Public plan catalog for the pricing page.
  getPlans: publicProcedure.query(() => ({
    configured: isStripeConfigured(),
    plans: PLAN_CATALOG,
  })),

  // Current user's plan + subscription record.
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const subscription = await db.getSubscriptionByUserId(ctx.user.id);
    return {
      plan: ctx.user.plan ?? "free",
      subscription,
    };
  }),

  // Create a Stripe Checkout Session and return its hosted URL.
  createCheckoutSession: protectedProcedure
    .input(z.object({ plan: PAID_PLAN, interval: INTERVAL.default("month") }))
    .mutation(async ({ ctx, input }) => {
      if (!isStripeConfigured()) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "התשלומים אינם מוגדרים כרגע. נסה שוב מאוחר יותר.",
        });
      }

      let priceId: string;
      try {
        priceId = getPriceId(input.plan, input.interval);
      } catch {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "התוכנית המבוקשת אינה זמינה כרגע.",
        });
      }

      const customerId = await ensureStripeCustomer(ctx.user);

      const session = await getStripe().checkout.sessions.create({
        mode: "subscription",
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        // Pro plan ships with a 14-day free trial (matches the pricing page).
        subscription_data:
          input.plan === "pro" ? { trial_period_days: 14 } : undefined,
        allow_promotion_codes: true,
        client_reference_id: String(ctx.user.id),
        metadata: { userId: String(ctx.user.id), plan: input.plan },
        success_url: `${ENV.appUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ENV.appUrl}/pricing?checkout=cancel`,
      });

      if (!session.url) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "יצירת התשלום נכשלה.",
        });
      }
      return { url: session.url };
    }),

  // Stripe-hosted Customer Portal for managing/canceling the subscription.
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    if (!isStripeConfigured()) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "התשלומים אינם מוגדרים כרגע.",
      });
    }
    if (!ctx.user.stripeCustomerId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "אין מנוי פעיל לניהול.",
      });
    }

    const session = await getStripe().billingPortal.sessions.create({
      customer: ctx.user.stripeCustomerId,
      return_url: `${ENV.appUrl}/dashboard`,
    });
    return { url: session.url };
  }),
});
