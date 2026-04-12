import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";
import Stripe from "stripe";
import type { TrustedLineItem } from "@/app/(user)/checkout/_actions/create-payment-intent";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  if (sig && webhookSecret && !webhookSecret.startsWith("whsec_REPLACE")) {
    try {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }
  } else {
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
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
  // Idempotency — unique constraint on paymentIntentId prevents duplicates
  const existing = await prisma.order.findUnique({
    where: { paymentIntentId: pi.id },
  });
  if (existing) return;

  const items: TrustedLineItem[] = JSON.parse(pi.metadata.items ?? "[]");
  if (!items.length) return;

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const shippingCost = subtotal >= 100 ? 0 : 9.99;
  const total = subtotal + shippingCost;
  const isPreorder = items.some((i) => i.isPreorder);

  // Race-condition-safe order number using current timestamp + pi suffix
  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${pi.id.slice(-6).toUpperCase()}`;

  const shipping = pi.shipping;

  await prisma.$transaction(async (tx) => {
    // Decrement stock for each item (skip pre-orders — stock already 0)
    for (const item of items) {
      if (!item.isPreorder) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    await tx.order.create({
      data: {
        orderNumber,
        status: "CONFIRMED",
        paymentIntentId: pi.id,
        isPreorder,
        customerName: shipping?.name ?? "Guest",
        customerEmail: pi.receipt_email ?? "",
        customerPhone: shipping?.phone ?? "",
        address: shipping?.address?.line1 ?? "",
        city: shipping?.address?.city ?? "",
        postalCode: shipping?.address?.postal_code ?? "",
        country: shipping?.address?.country ?? "",
        subtotal,
        shippingCost,
        total,
        notes: null,
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            productName: i.name,
            productImage: i.image,
            size: i.size ?? null,
            quantity: i.quantity,
            unitPrice: i.price,
            isPreorder: i.isPreorder,
          })),
        },
        statusHistory: {
          create: {
            status: "CONFIRMED",
            note: `Payment received via Stripe (${pi.id})`,
          },
        },
      },
    });
  });
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  // Log the failure — useful for debugging and future alerting
  const failureMessage = pi.last_payment_error?.message ?? "Unknown error";
  console.error(`Payment failed for PaymentIntent ${pi.id}: ${failureMessage}`);
  // No order is created — nothing to clean up
}
