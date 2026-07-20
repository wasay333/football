import type Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { Resend } from "resend";
import type { TrustedLineItem } from "@/app/(user)/checkout/_actions/create-payment-intent";
import { buildLowStockAlertEmail } from "@/lib/email/low-stock-alert";
import { buildOrderConfirmationEmail } from "@/lib/email/order-confirmation";
import { normalizeCountryCode } from "@/lib/country-code";
import { getOptionalServerEnv } from "@/lib/env.server";
import { getInitialOrderStatus, getInitialOrderStatusNote } from "@/lib/order-workflow";
import { revalidateStorefront } from "@/lib/storefront-revalidate";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";

type SyncOrderResult =
  | { ok: true; orderNumber: string; created: boolean }
  | { ok: false; reason: string };

class InsufficientStockError extends Error {
  constructor(productId: string) {
    super(`Insufficient stock remained to finalize payment for product ${productId}.`)
    this.name = "InsufficientStockError";
  }
}

export async function syncOrderFromPaymentIntent(pi: Stripe.PaymentIntent): Promise<SyncOrderResult> {
  const customerSnapshot = await extractCustomerSnapshot(pi);
  const items: TrustedLineItem[] = JSON.parse(pi.metadata.items ?? "[]");
  if (!items.length) {
    return { ok: false, reason: "No line items found in PaymentIntent metadata." };
  }

  const financialSnapshot = buildFinancialSnapshot(pi, items)
  const existing = await prisma.order.findUnique({
    where: { paymentIntentId: pi.id },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      customerEmail: true,
      customerPhone: true,
      address: true,
      city: true,
      stateOrProvinceCode: true,
      postalCode: true,
      country: true,
      subtotal: true,
      discountAmount: true,
      discountLabel: true,
      shippingCost: true,
      total: true,
      shippingServiceType: true,
      shippingServiceName: true,
      shippingCurrency: true,
      shippingDeliveryTimestamp: true,
      shippingTransitTime: true,
    },
  });

  if (existing) {
    await backfillOrderSnapshot(existing.id, existing, customerSnapshot, financialSnapshot)
    return { ok: true, orderNumber: existing.orderNumber, created: false };
  }
  const { subtotal, discountAmount, discountLabel, shippingCost, total, shippingServiceType, shippingServiceName, shippingCurrency, shippingDeliveryTimestamp, shippingTransitTime } = financialSnapshot
  const isPreorder = items.some((item) => item.isPreorder);
  const initialStatus = getInitialOrderStatus(isPreorder);
  const orderNumber = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${pi.id.slice(-6).toUpperCase()}`;
  const nonPreorderQuantities = items.reduce<Record<string, number>>((acc, item) => {
    if (!item.isPreorder) {
      acc[item.productId] = (acc[item.productId] ?? 0) + item.quantity;
    }

    return acc;
  }, {});
  try {
    await prisma.$transaction(async (tx) => {
      for (const [productId, quantity] of Object.entries(nonPreorderQuantities)) {
        const updated = await tx.product.updateMany({
          where: {
            id: productId,
            stock: { gte: quantity },
          },
          data: {
            stock: { decrement: quantity },
          },
        });

        if (updated.count !== 1) {
          throw new InsufficientStockError(productId);
        }
      }

      await tx.order.create({
        data: {
          orderNumber,
          status: initialStatus,
          paymentIntentId: pi.id,
          isPreorder,
          customerName: customerSnapshot.customerName,
          customerEmail: customerSnapshot.customerEmail,
          customerPhone: customerSnapshot.customerPhone,
          address: customerSnapshot.address,
          city: customerSnapshot.city,
          stateOrProvinceCode: customerSnapshot.stateOrProvinceCode,
          postalCode: customerSnapshot.postalCode,
          country: customerSnapshot.country,
          subtotal,
          discountAmount,
          discountLabel,
          shippingCost,
          total,
          shippingServiceType,
          shippingServiceName,
          shippingCurrency,
          shippingDeliveryTimestamp,
          shippingTransitTime,
          notes: null,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              productName: item.name,
              productImage: item.image,
              quantity: item.quantity,
              unitPrice: item.price,
              isPreorder: item.isPreorder,
            })),
          },
          statusHistory: {
            create: {
              status: initialStatus,
              note: getInitialOrderStatusNote(isPreorder, pi.id, pi.metadata.fedexServiceName),
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

    if (error instanceof InsufficientStockError) {
      return { ok: false, reason: error.message };
    }

    throw error;
  }

  await sendOrderEmails({
    pi,
    items,
    orderNumber,
    customerName: customerSnapshot.customerName,
    customerEmail: customerSnapshot.customerEmail,
    address: customerSnapshot.address,
    city: customerSnapshot.city,
    postalCode: customerSnapshot.postalCode,
    country: customerSnapshot.country,
    subtotal,
    discountAmount,
    discountLabel,
    shippingCost,
    total,
  });

  revalidateStorefront(items.map((item) => item.productId))

  return { ok: true, orderNumber, created: true };
}

async function extractCustomerSnapshot(pi: Stripe.PaymentIntent) {
  const shipping = pi.shipping
  const billing = await extractChargeBillingDetails(pi)

  return {
    customerName: firstNonEmpty(shipping?.name, pi.metadata.customerName, billing.name, "Guest"),
    customerEmail: firstNonEmpty(pi.receipt_email, pi.metadata.customerEmail, billing.email),
    customerPhone: firstNonEmpty(shipping?.phone, pi.metadata.customerPhone, billing.phone),
    address: firstNonEmpty(shipping?.address?.line1, pi.metadata.customerAddressLine1, billing.address.line1),
    city: firstNonEmpty(shipping?.address?.city, pi.metadata.customerCity, billing.address.city),
    stateOrProvinceCode: firstNonEmpty(
      shipping?.address?.state,
      pi.metadata.customerState,
      billing.address.state,
    ).toUpperCase(),
    postalCode: firstNonEmpty(
      shipping?.address?.postal_code,
      pi.metadata.customerPostalCode,
      billing.address.postal_code,
    ),
    country: normalizeCountryCode(
      firstNonEmpty(shipping?.address?.country, pi.metadata.customerCountry, billing.address.country),
    ),
  }
}

async function extractChargeBillingDetails(pi: Stripe.PaymentIntent) {
  const latestChargeId =
    typeof pi.latest_charge === "string"
      ? pi.latest_charge
      : pi.latest_charge?.id

  if (!latestChargeId) {
    return {
      name: "",
      email: "",
      phone: "",
      address: {
        line1: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
      },
    }
  }

  try {
    const charge = await stripe.charges.retrieve(latestChargeId)
    return {
      name: firstNonEmpty(charge.billing_details?.name),
      email: firstNonEmpty(charge.billing_details?.email),
      phone: firstNonEmpty(charge.billing_details?.phone),
      address: {
        line1: firstNonEmpty(charge.billing_details?.address?.line1),
        city: firstNonEmpty(charge.billing_details?.address?.city),
        state: firstNonEmpty(charge.billing_details?.address?.state),
        postal_code: firstNonEmpty(charge.billing_details?.address?.postal_code),
        country: firstNonEmpty(charge.billing_details?.address?.country),
      },
    }
  } catch (error) {
    console.error(`Failed to load billing details from latest charge for PaymentIntent ${pi.id}:`, error)
    return {
      name: "",
      email: "",
      phone: "",
      address: {
        line1: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
      },
    }
  }
}

function buildFinancialSnapshot(pi: Stripe.PaymentIntent, items: TrustedLineItem[]) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = Number(pi.metadata.discountAmount || 0);
  const discountLabel = pi.metadata.discountLabel?.trim() || null;
  const metadataShippingCost = Number(pi.metadata.fedexShippingAmount || 0);
  const chargedTotal = Number.isFinite(pi.amount)
    ? Number((pi.amount / 100).toFixed(2))
    : subtotal - discountAmount + metadataShippingCost
  const derivedShippingCost = Number((chargedTotal - subtotal + discountAmount).toFixed(2))
  const shippingCost = metadataShippingCost > 0
    ? metadataShippingCost
    : derivedShippingCost > 0
      ? derivedShippingCost
      : 0
  const total = chargedTotal > 0 ? chargedTotal : subtotal - discountAmount + shippingCost;
  const shippingServiceType = firstNonEmpty(pi.metadata.fedexServiceType);
  const shippingServiceName = firstNonEmpty(pi.metadata.fedexServiceName);
  const shippingCurrency = firstNonEmpty(pi.metadata.fedexShippingCurrency, shippingCost > 0 ? 'USD' : '');
  const shippingDeliveryTimestamp = parseOptionalDate(pi.metadata.fedexDeliveryTimestamp);
  const shippingTransitTime = firstNonEmpty(pi.metadata.fedexTransitTime);

  return {
    subtotal,
    discountAmount,
    discountLabel,
    shippingCost,
    total,
    shippingServiceType,
    shippingServiceName,
    shippingCurrency,
    shippingDeliveryTimestamp,
    shippingTransitTime,
  }
}

async function backfillOrderSnapshot(
  orderId: string,
  existing: {
    customerName: string
    customerEmail: string
    customerPhone: string | null
    address: string
    city: string
    stateOrProvinceCode: string | null
    postalCode: string
    country: string
    subtotal: Prisma.Decimal
    discountAmount: Prisma.Decimal
    discountLabel: string | null
    shippingCost: Prisma.Decimal
    total: Prisma.Decimal
    shippingServiceType: string | null
    shippingServiceName: string | null
    shippingCurrency: string | null
    shippingDeliveryTimestamp: Date | null
    shippingTransitTime: string | null
  },
  snapshot: Awaited<ReturnType<typeof extractCustomerSnapshot>>,
  financialSnapshot: ReturnType<typeof buildFinancialSnapshot>,
) {
  const updates: Record<string, string | number | Date | null> = {}

  if ((!existing.customerName || existing.customerName === 'Guest') && snapshot.customerName && snapshot.customerName !== 'Guest') {
    updates.customerName = snapshot.customerName
  }
  if (!existing.customerEmail && snapshot.customerEmail) {
    updates.customerEmail = snapshot.customerEmail
  }
  if (!existing.customerPhone && snapshot.customerPhone) {
    updates.customerPhone = snapshot.customerPhone
  }
  if (!existing.address && snapshot.address) {
    updates.address = snapshot.address
  }
  if (!existing.city && snapshot.city) {
    updates.city = snapshot.city
  }
  if (!existing.stateOrProvinceCode && snapshot.stateOrProvinceCode) {
    updates.stateOrProvinceCode = snapshot.stateOrProvinceCode
  }
  if (!existing.postalCode && snapshot.postalCode) {
    updates.postalCode = snapshot.postalCode
  }
  if (!existing.country && snapshot.country) {
    updates.country = snapshot.country
  }
  if (Number(existing.subtotal) !== financialSnapshot.subtotal) {
    updates.subtotal = financialSnapshot.subtotal
  }
  if (Number(existing.discountAmount) !== financialSnapshot.discountAmount) {
    updates.discountAmount = financialSnapshot.discountAmount
  }
  if ((existing.discountLabel ?? '') !== (financialSnapshot.discountLabel ?? '')) {
    updates.discountLabel = financialSnapshot.discountLabel
  }
  if (Number(existing.shippingCost) !== financialSnapshot.shippingCost) {
    updates.shippingCost = financialSnapshot.shippingCost
  }
  if (Number(existing.total) !== financialSnapshot.total) {
    updates.total = financialSnapshot.total
  }
  if ((existing.shippingServiceType ?? '') !== financialSnapshot.shippingServiceType) {
    updates.shippingServiceType = financialSnapshot.shippingServiceType || null
  }
  if ((existing.shippingServiceName ?? '') !== financialSnapshot.shippingServiceName) {
    updates.shippingServiceName = financialSnapshot.shippingServiceName || null
  }
  if ((existing.shippingCurrency ?? '') !== financialSnapshot.shippingCurrency) {
    updates.shippingCurrency = financialSnapshot.shippingCurrency || null
  }
  if ((existing.shippingTransitTime ?? '') !== financialSnapshot.shippingTransitTime) {
    updates.shippingTransitTime = financialSnapshot.shippingTransitTime || null
  }

  const existingDeliveryTimestamp = existing.shippingDeliveryTimestamp?.toISOString() ?? null
  const snapshotDeliveryTimestamp = financialSnapshot.shippingDeliveryTimestamp?.toISOString() ?? null
  if (existingDeliveryTimestamp !== snapshotDeliveryTimestamp) {
    updates.shippingDeliveryTimestamp = financialSnapshot.shippingDeliveryTimestamp
  }

  if (Object.keys(updates).length === 0) {
    return
  }

  await prisma.order.update({
    where: { id: orderId },
    data: updates,
  })
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
  discountAmount,
  discountLabel,
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
  discountAmount: number;
  discountLabel: string | null;
  shippingCost: number;
  total: number;
}) {
  const resendApiKey = getOptionalServerEnv("RESEND_API_KEY");
  const resendFromEmail = getOptionalServerEnv("RESEND_FROM_EMAIL") ?? "Foocaps <onboarding@resend.dev>";

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
    const hasPreorderItems = items.some((item) => item.isPreorder);
    await resend.emails.send({
      from: resendFromEmail,
      to: customerEmail,
      subject: `${hasPreorderItems ? "Pre-order Confirmed" : "Order Confirmed"} - ${orderNumber}`,
      html: buildOrderConfirmationEmail({
        orderNumber,
        customerName,
        customerEmail,
        items: items.map((item) => ({
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          isPreorder: item.isPreorder,
        })),
        subtotal,
        discountAmount,
        discountLabel,
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

function parseOptionalDate(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
