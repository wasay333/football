import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { syncOrderFromPaymentIntent } from "@/lib/stripe-order-sync";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Webhook secret or signature missing - set STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    console.info(`[stripe-webhook] Verified event ${event.type} (${event.id})`);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "payment_intent.succeeded":
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
    case "payment_intent.payment_failed":
      await handlePaymentFailed(event.data.object as Stripe.PaymentIntent);
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function handlePaymentSuccess(pi: Stripe.PaymentIntent) {
  console.info("[stripe-webhook] Handling successful payment", {
    paymentIntentId: pi.id,
    hasReceiptEmail: Boolean(pi.receipt_email),
    hasShipping: Boolean(pi.shipping),
  });

  const result = await syncOrderFromPaymentIntent(pi);
  if (!result.ok) {
    console.warn(`[stripe-webhook] Unable to create order for PaymentIntent ${pi.id}: ${result.reason}`);
    return;
  }

  console.info(
    `[stripe-webhook] Order ${result.orderNumber} ${result.created ? "created" : "already existed"} for PaymentIntent ${pi.id}`,
  );
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const failureMessage = pi.last_payment_error?.message ?? "Unknown error";
  console.warn("[stripe-webhook] Payment failed", {
    paymentIntentId: pi.id,
    failureMessage,
  });
  console.error(`Payment failed for PaymentIntent ${pi.id}: ${failureMessage}`);
}
