import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { Resend } from "resend";
import type { TrustedLineItem } from "@/app/(user)/checkout/_actions/create-payment-intent";
import { buildLowStockAlertEmail } from "@/lib/email/low-stock-alert";
import { buildOrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";

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
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? "Foocaps <onboarding@resend.dev>";
  const hasResendApiKey = Boolean(resendApiKey);
  const resend = resendApiKey ? new Resend(resendApiKey) : null;

  console.info("[stripe-webhook] Handling successful payment", {
    paymentIntentId: pi.id,
    hasReceiptEmail: Boolean(pi.receipt_email),
    hasShipping: Boolean(pi.shipping),
    hasResendApiKey,
    resendFromEmail,
  });

  if (hasResendApiKey) {
    console.info(`[stripe-webhook] Resend client initialized for PaymentIntent ${pi.id}`);
  } else {
    console.warn(`[stripe-webhook] RESEND_API_KEY missing for PaymentIntent ${pi.id}`);
  }

  // Idempotency - unique constraint on paymentIntentId prevents duplicates
  const existing = await prisma.order.findUnique({
    where: { paymentIntentId: pi.id },
  });
  if (existing) {
    console.info(`[stripe-webhook] Order already exists for PaymentIntent ${pi.id}; skipping duplicate webhook.`);
    return;
  }

  const items: TrustedLineItem[] = JSON.parse(pi.metadata.items ?? "[]");
  if (!items.length) {
    console.warn(`[stripe-webhook] No line items found in metadata for PaymentIntent ${pi.id}`);
    return;
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal >= 100 ? 0 : 9.99;
  const total = subtotal + shippingCost;
  const isPreorder = items.some((item) => item.isPreorder);

  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${pi.id.slice(-6).toUpperCase()}`;
  const shipping = pi.shipping;

  const customerName = firstNonEmpty(shipping?.name, pi.metadata.customerName, "Guest");
  const customerEmail = firstNonEmpty(pi.receipt_email, pi.metadata.customerEmail);
  const customerPhone = firstNonEmpty(shipping?.phone, pi.metadata.customerPhone);
  const address = firstNonEmpty(shipping?.address?.line1, pi.metadata.customerAddressLine1);
  const city = firstNonEmpty(shipping?.address?.city, pi.metadata.customerCity);
  const postalCode = firstNonEmpty(shipping?.address?.postal_code, pi.metadata.customerPostalCode);
  const country = firstNonEmpty(shipping?.address?.country, pi.metadata.customerCountry);

  console.info("[stripe-webhook] Resolved customer details", {
    paymentIntentId: pi.id,
    orderNumber,
    customerEmail: customerEmail || null,
    customerName,
    hasAddress: Boolean(address),
    city: city || null,
    postalCode: postalCode || null,
    country: country || null,
    lineItemCount: items.length,
  });

  await prisma.$transaction(async (tx) => {
    // Decrement stock for each item. Skip pre-orders because those do not consume inventory.
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
        customerPhone,
        address,
        city,
        postalCode,
        country,
        subtotal,
        shippingCost,
        total,
        notes: null,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.name,
            productImage: item.image,
            size: item.size ?? null,
            quantity: item.quantity,
            unitPrice: item.price,
            isPreorder: item.isPreorder,
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

  console.info(`[stripe-webhook] Order ${orderNumber} saved for PaymentIntent ${pi.id}`);

  const nonPreorderIds = items.filter((item) => !item.isPreorder).map((item) => item.productId);
  if (nonPreorderIds.length && resend) {
    const updatedProducts = await prisma.product.findMany({
      where: { id: { in: nonPreorderIds } },
      select: { name: true, stock: true, lowStockThreshold: true },
    });

    const lowStockItems = updatedProducts.filter((product) => product.stock <= product.lowStockThreshold);

    if (lowStockItems.length) {
      try {
        console.info("[stripe-webhook] Sending low stock alert", {
          paymentIntentId: pi.id,
          orderNumber,
          lowStockCount: lowStockItems.length,
        });

        await resend.emails.send({
          from: resendFromEmail,
          to: "info@foocaps.com",
          subject: `Low Stock Alert - ${lowStockItems.length} product${lowStockItems.length > 1 ? "s" : ""} need restocking`,
          html: buildLowStockAlertEmail({ items: lowStockItems }),
        });

        console.info(`[stripe-webhook] Low stock alert sent for order ${orderNumber}`);
      } catch (err) {
        console.error("Failed to send low stock alert:", err);
      }
    }
  }

  if (!resend) {
    console.error(`Order ${orderNumber} created, but RESEND_API_KEY is missing so no emails were sent.`);
    return;
  }

  if (!customerEmail) {
    console.error(`Order ${orderNumber} created, but customer email is missing on PaymentIntent ${pi.id}.`);
    return;
  }

  try {
    console.info("[stripe-webhook] Sending order confirmation email", {
      paymentIntentId: pi.id,
      orderNumber,
      to: customerEmail,
      from: resendFromEmail,
    });

    await resend.emails.send({
      from: resendFromEmail,
      to: customerEmail,
      subject: `Order Confirmed - ${orderNumber}`,
      html: buildOrderConfirmationEmail({
        orderNumber,
        customerName,
        items: items.map((item) => ({
          productName: item.name,
          size: item.size,
          quantity: item.quantity,
          unitPrice: item.price,
          isPreorder: item.isPreorder,
        })),
        subtotal,
        shippingCost,
        total,
        address,
        city,
        postalCode,
        country,
      }),
    });

    console.info(`[stripe-webhook] Order confirmation email sent for order ${orderNumber}`);
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
  }
}

async function handlePaymentFailed(pi: Stripe.PaymentIntent) {
  const failureMessage = pi.last_payment_error?.message ?? "Unknown error";
  console.warn("[stripe-webhook] Payment failed", {
    paymentIntentId: pi.id,
    failureMessage,
  });
  console.error(`Payment failed for PaymentIntent ${pi.id}: ${failureMessage}`);
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}
