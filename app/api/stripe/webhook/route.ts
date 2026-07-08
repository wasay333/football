import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getOptionalServerEnv } from "@/lib/env.server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";
import { syncOrderFromPaymentIntent } from "@/lib/stripe-order-sync";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = getOptionalServerEnv("STRIPE_WEBHOOK_SECRET");

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
    case "payment_intent.canceled":
      await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
      break;
    case "charge.refunded":
      await handleChargeRefunded(event.data.object as Stripe.Charge);
      break;
    case "charge.dispute.created":
      await handleChargeDisputeCreated(event.data.object as Stripe.Dispute);
      break;
    case "charge.dispute.closed":
      await handleChargeDisputeClosed(event.data.object as Stripe.Dispute);
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

  const latestPaymentIntent = await stripe.paymentIntents.retrieve(pi.id);
  const result = await syncOrderFromPaymentIntent(latestPaymentIntent);
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

async function handlePaymentCanceled(pi: Stripe.PaymentIntent) {
  await updateOrderFromPaymentIntent(pi.id, {
    status: "CANCELLED",
    note: `Stripe payment intent canceled${pi.cancellation_reason ? `: ${pi.cancellation_reason}` : ""}`,
    skipTerminalStatuses: ["SHIPPED", "DELIVERED", "REFUNDED"],
  });
}

async function handleChargeRefunded(charge: Stripe.Charge) {
  const paymentIntentId =
    typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;

  if (!paymentIntentId) {
    return;
  }

  const isFullRefund = charge.amount_refunded >= charge.amount;
  await updateOrderFromPaymentIntent(paymentIntentId, {
    status: isFullRefund ? "REFUNDED" : undefined,
    note: isFullRefund
      ? `Stripe charge fully refunded (${formatCurrency(charge.amount_refunded, charge.currency)})`
      : `Stripe charge partially refunded (${formatCurrency(charge.amount_refunded, charge.currency)})`,
    skipTerminalStatuses: isFullRefund ? ["REFUNDED"] : undefined,
  });
}

async function handleChargeDisputeCreated(dispute: Stripe.Dispute) {
  const paymentIntentId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id;

  if (!paymentIntentId) {
    return;
  }

  await updateOrderFromPaymentIntent(paymentIntentId, {
    note: `Stripe dispute opened (${dispute.reason ?? "unknown"} - ${formatCurrency(dispute.amount, dispute.currency)})`,
  });
}

async function handleChargeDisputeClosed(dispute: Stripe.Dispute) {
  const paymentIntentId =
    typeof dispute.payment_intent === "string"
      ? dispute.payment_intent
      : dispute.payment_intent?.id;

  if (!paymentIntentId) {
    return;
  }

  await updateOrderFromPaymentIntent(paymentIntentId, {
    note: `Stripe dispute closed (${dispute.status ?? "unknown"})`,
  });
}

async function updateOrderFromPaymentIntent(
  paymentIntentId: string,
  {
    status,
    note,
    skipTerminalStatuses = [],
  }: {
    status?: "CANCELLED" | "REFUNDED";
    note: string;
    skipTerminalStatuses?: Array<"SHIPPED" | "DELIVERED" | "REFUNDED">;
  },
) {
  const order = await prisma.order.findUnique({
    where: { paymentIntentId },
    select: { id: true, orderNumber: true, status: true },
  });

  if (!order) {
    console.warn(`[stripe-webhook] No order found for PaymentIntent ${paymentIntentId}`);
    return;
  }

  if (skipTerminalStatuses.includes(order.status as "SHIPPED" | "DELIVERED" | "REFUNDED")) {
    console.info(
      `[stripe-webhook] Skipped status change for ${order.orderNumber} because it is already ${order.status}`,
    );
    return;
  }

  const nextStatus = status && order.status !== status ? status : undefined;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: nextStatus ? { status: nextStatus } : {},
    }),
    prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: nextStatus ?? order.status,
        note,
      },
    }),
  ]);

  console.info(
    `[stripe-webhook] Order ${order.orderNumber} ${nextStatus ? `updated to ${nextStatus}` : "annotated"} from Stripe lifecycle event`,
  );
}

function formatCurrency(amountMinor: number, currency: string | null) {
  const code = (currency ?? "usd").toUpperCase();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: code,
  }).format(amountMinor / 100);
}
