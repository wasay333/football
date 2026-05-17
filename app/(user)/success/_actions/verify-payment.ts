"use server";

import { stripe } from "@/lib/stripe";
import { syncOrderFromPaymentIntent } from "@/lib/stripe-order-sync";
import { z } from "zod";

const paymentIntentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^pi_[A-Za-z0-9]+$/, "Invalid payment intent id.");

export async function verifyPayment(paymentIntentId: string) {
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentIdSchema.parse(paymentIntentId));
    if (pi.status === "succeeded") {
      const result = await syncOrderFromPaymentIntent(pi);
      if (!result.ok) {
        console.error(`[verify-payment] Unable to sync order for PaymentIntent ${pi.id}: ${result.reason}`);
        return { status: "processing" };
      }
    }

    return { status: pi.status }; // 'succeeded' | 'processing' | 'requires_payment_method' | etc.
  } catch {
    return { status: "unknown" };
  }
}
