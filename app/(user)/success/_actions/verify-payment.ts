"use server";

import { stripe } from "@/lib/stripe";
import { syncOrderFromPaymentIntent } from "@/lib/stripe-order-sync";

export async function verifyPayment(paymentIntentId: string) {
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
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
