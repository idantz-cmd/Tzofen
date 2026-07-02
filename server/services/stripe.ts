/**
 * Stripe integration — client + plan/price mapping.
 *
 * Billing is optional: if STRIPE_SECRET_KEY is unset, isStripeConfigured() is
 * false and callers surface a friendly "not configured" error instead of
 * crashing. Card data never touches our servers — we use hosted Checkout and the
 * Customer Portal.
 */
import Stripe from "stripe";
import { ENV } from "../_core/env";

export type PaidPlan = "pro" | "champion";
export type BillingInterval = "month" | "year";

let _stripe: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(ENV.stripe.secretKey);
}

export function getStripe(): Stripe {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured (missing STRIPE_SECRET_KEY)");
  }
  if (!_stripe) {
    _stripe = new Stripe(ENV.stripe.secretKey);
  }
  return _stripe;
}

/** Display catalog for the pricing page. Prices are the marketed amounts. */
export const PLAN_CATALOG: Array<{
  id: PaidPlan;
  name: string;
  monthlyPrice: number;
  currency: "ILS";
}> = [
  { id: "pro", name: "פרו", monthlyPrice: 29, currency: "ILS" },
  { id: "champion", name: "אלוף", monthlyPrice: 79, currency: "ILS" },
];

/** Resolve the configured Stripe price id for a plan + interval. */
export function getPriceId(plan: PaidPlan, interval: BillingInterval): string {
  const id = ENV.stripe.prices[plan]?.[interval];
  if (!id) {
    throw new Error(`No Stripe price configured for ${plan}/${interval}`);
  }
  return id;
}

/** Reverse-map a Stripe price id back to our plan + interval (for webhooks). */
export function priceToPlan(
  priceId: string | null | undefined
): { plan: PaidPlan; interval: BillingInterval } | null {
  if (!priceId) return null;
  const plans: PaidPlan[] = ["pro", "champion"];
  const intervals: BillingInterval[] = ["month", "year"];
  for (const plan of plans) {
    for (const interval of intervals) {
      if (ENV.stripe.prices[plan]?.[interval] === priceId) {
        return { plan, interval };
      }
    }
  }
  return null;
}
