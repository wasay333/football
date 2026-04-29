import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";
import Stripe from "stripe";
import { Resend } from "resend";
import { buildOrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { buildLowStockAlertEmail } from "@/lib/email/low-stock-alert";
import type { TrustedLineItem } from "@/app/(user)/checkout/_actions/create-payment-intent";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.error("Webhook secret or signature missing — set STRIPE_WEBHOOK_SECRET");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
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
  const resend = new Resend(process.env.RESEND_API_KEY);
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

  const customerName = shipping?.name ?? "Guest";
  const customerEmail = pi.receipt_email ?? "";
  const address = shipping?.address?.line1 ?? "";
  const city = shipping?.address?.city ?? "";
  const postalCode = shipping?.address?.postal_code ?? "";
  const country = shipping?.address?.country ?? "";

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
        customerName,
        customerEmail,
        customerPhone: shipping?.phone ?? "",
        address,
        city,
        postalCode,
        country,
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

  // Check for low stock on non-preorder items and alert admin
  const nonPreorderIds = items.filter((i) => !i.isPreorder).map((i) => i.productId);
  if (nonPreorderIds.length) {
    const updatedProducts = await prisma.product.findMany({
      where: { id: { in: nonPreorderIds } },
      select: { name: true, stock: true, lowStockThreshold: true },
    });

    const lowStockItems = updatedProducts.filter((p) => p.stock <= p.lowStockThreshold);

    if (lowStockItems.length) {
      resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "Foocaps <onboarding@resend.dev>",
        to: "info@foocaps.com",
        subject: `⚠️ Low Stock Alert — ${lowStockItems.length} product${lowStockItems.length > 1 ? "s" : ""} need restocking`,
        html: buildLowStockAlertEmail({ items: lowStockItems }),
      }).catch((err) => console.error("Failed to send low stock alert:", err));
    }
  }

  // Send order confirmation email — fire and forget, don't block the webhook response
  if (customerEmail) {
    resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "Foocaps <onboarding@resend.dev>",
      to: customerEmail,
      subject: `Order Confirmed — ${orderNumber}`,
      html: buildOrderConfirmationEmail({
        orderNumber,
        customerName,
        items: items.map((i) => ({
          productName: i.name,
          size: i.size,
          quantity: i.quantity,
          unitPrice: i.price,
          isPreorder: i.isPreorder,
        })),
        subtotal,
        shippingCost,
        total,
        address,
        city,
        postalCode,
        country,
      }),
    }).catch((err) => console.error("Failed to send order confirmation email:", err));
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  // Log the failure — useful for debugging and future alerting
  const failureMessage = pi.last_payment_error?.message ?? "Unknown error";
  console.error(`Payment failed for PaymentIntent ${pi.id}: ${failureMessage}`);
  // No order is created — nothing to clean up
}
