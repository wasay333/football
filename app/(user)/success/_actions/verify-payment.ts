"use server";

import { stripe } from "@/lib/stripe";

export async function verifyPayment(paymentIntentId: string) {
  try {
    const pi = await stripe.paymentIntents.retrieve(paymentIntentId);
    return { status: pi.status }; // 'succeeded' | 'processing' | 'requires_payment_method' | etc.
  } catch {
    return { status: "unknown" };
  }
}
