import Stripe from "stripe";
import { requireServerEnv } from "@/lib/env.server";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(requireServerEnv("STRIPE_SECRET_KEY"), {
      apiVersion: "2026-02-25.clover",
    });
  }
  return _stripe;
}

// Keep named k for backwards compatibility
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});
