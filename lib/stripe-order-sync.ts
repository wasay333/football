import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import type { TrustedLineItem } from "@/app/(user)/checkout/_actions/create-payment-intent";
import { buildLowStockAlertEmail } from "@/lib/email/low-stock-alert";
import { buildOrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { prisma } from "@/prisma";

type SyncOrderResult =
  | { ok: true; orderNumber: string; created: boolean }
  | { ok: false; reason: string };

export async function syncOrderFromPaymentIntent(pi: Stripe.PaymentIntent): Promise<SyncOrderResult> {
  const existing = await prisma.order.findUnique({
    where: { paymentIntentId: pi.id },
    select: { orderNumber: true },
  });

  if (existing) {
    return { ok: true, orderNumber: existing.orderNumber, created: false };
  }

  const items: TrustedLineItem[] = JSON.parse(pi.metadata.items ?? "[]");
  if (!items.length) {
    return { ok: false, reason: "No line items found in PaymentIntent metadata." };
  }

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = Number(pi.metadata.fedexShippingAmount || 0);
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

  try {
    await prisma.$transaction(async (tx) => {
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
              note: pi.metadata.fedexServiceName
                ? `Payment received via Stripe (${pi.id}). FedEx service selected: ${pi.metadata.fedexServiceName}.`
                : `Payment received via Stripe (${pi.id})`,
            },
          },
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const duplicate = await prisma.order.findUnique({
        where: { paymentIntentId: pi.id },
        select: { orderNumber: true },
      });

      if (duplicate) {
        return { ok: true, orderNumber: duplicate.orderNumber, created: false };
      }
    }

    throw error;
  }

  await sendOrderEmails({
    pi,
    items,
    orderNumber,
    customerName,
    customerEmail,
    address,
    city,
    postalCode,
    country,
    subtotal,
    shippingCost,
    total,
  });

  return { ok: true, orderNumber, created: true };
}

async function sendOrderEmails({
  pi,
  items,
  orderNumber,
  customerName,
  customerEmail,
  address,
  city,
  postalCode,
  country,
  subtotal,
  shippingCost,
  total,
}: {
  pi: Stripe.PaymentIntent;
  items: TrustedLineItem[];
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  subtotal: number;
  shippingCost: number;
  total: number;
}) {
  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? "Foocaps <onboarding@resend.dev>";

  if (!resendApiKey) {
    console.error(`Order ${orderNumber} created, but RESEND_API_KEY is missing so no emails were sent.`);
    return;
  }

  const resend = new Resend(resendApiKey);
  const nonPreorderIds = items.filter((item) => !item.isPreorder).map((item) => item.productId);

  if (nonPreorderIds.length) {
    const updatedProducts = await prisma.product.findMany({
      where: { id: { in: nonPreorderIds } },
      select: { name: true, stock: true, lowStockThreshold: true },
    });

    const lowStockItems = updatedProducts.filter((product) => product.stock <= product.lowStockThreshold);

    if (lowStockItems.length) {
      try {
        await resend.emails.send({
          from: resendFromEmail,
          to: "info@foocaps.com",
          subject: `Low Stock Alert - ${lowStockItems.length} product${lowStockItems.length > 1 ? "s" : ""} need restocking`,
          html: buildLowStockAlertEmail({ items: lowStockItems }),
        });
      } catch (error) {
        console.error("Failed to send low stock alert:", error);
      }
    }
  }

  if (!customerEmail) {
    console.error(`Order ${orderNumber} created, but customer email is missing on PaymentIntent ${pi.id}.`);
    return;
  }

  try {
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
  } catch (error) {
    console.error("Failed to send order confirmation email:", error);
  }
}

function firstNonEmpty(...values: Array<string | null | undefined>) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}
