"use server";

import Stripe from 'stripe'
import { z } from 'zod'
import { stripe } from "@/lib/stripe";
import { requireServerEnv } from "@/lib/env.server";
import { calculateCheckoutTotals } from '@/lib/checkout-discounts';
import { prisma } from "@/prisma";

export type CartLineInput = {
  productId: string;
  quantity: number;
};

// Shape stored in   metadata — prices come from DB, not the client
export type TrustedLineItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  isPreorder: boolean;
};

export type TrustedTotals = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  discountLabel: string | null;
};

export type CheckoutCustomerDetails = {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
};

const paymentIntentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(255)
  .regex(/^pi_[A-Za-z0-9]+$/, 'Invalid checkout session.')

const cartLineInputSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1).max(50),
})

const cartLineInputsSchema = z.array(cartLineInputSchema).min(1).max(25)

const trustedLineItemSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1).max(255),
  price: z.number().finite().nonnegative(),
  quantity: z.number().int().min(1).max(50),
  image: z.string().max(2048),
  isPreorder: z.boolean(),
})

const customerDetailsSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  address: z.string().trim().min(1).max(200),
  city: z.string().trim().min(1).max(100),
  state: z.string().trim().max(50).optional().or(z.literal('')),
  postalCode: z.string().trim().min(1).max(20),
  country: z.string().trim().length(2).regex(/^[A-Za-z]{2}$/),
})

function normalizeCartLines(inputs: CartLineInput[]) {
  const parsed = cartLineInputsSchema.safeParse(inputs)
  if (!parsed.success) return null

  const byProduct = new Map<string, number>()
  for (const line of parsed.data) {
    byProduct.set(line.productId, (byProduct.get(line.productId) ?? 0) + line.quantity)
  }

  const normalized = Array.from(byProduct.entries()).map(([productId, quantity]) => ({
    productId,
    quantity,
  }))

  return cartLineInputsSchema.safeParse(normalized).success ? normalized : null
}

export async function createPaymentIntent(inputs: CartLineInput[]) {
  const normalizedInputs = normalizeCartLines(inputs)
  if (!normalizedInputs?.length) return { error: "Cart is empty or invalid" };
  const publishableKey = requireServerEnv("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");

  // Fetch all products in one query — server is the source of truth for price
  const products = await prisma.product.findMany({
    where: { id: { in: normalizedInputs.map((i) => i.productId) } },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      allowPreorder: true,
      status: true,
      mannequinImage: true,
      capImage1: true,
    },
  });

  const lines: TrustedLineItem[] = [];

  for (const input of normalizedInputs) {
    const product = products.find((p) => p.id === input.productId);

    if (!product || product.status !== "ACTIVE") {
      return {
        error: `"${product?.name ?? input.productId}" is no longer available.`,
      };
    }

    if (product.stock < input.quantity && !product.allowPreorder) {
      return {
        error: `"${product.name}" only has ${product.stock} unit${product.stock === 1 ? "" : "s"} left.`,
      };
    }

    lines.push({
      productId: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: input.quantity,
      image: product.mannequinImage ?? product.capImage1 ?? "",
      isPreorder: product.stock === 0 && product.allowPreorder,
    });
  }

  const totals = await calculateCheckoutTotals(lines)
  const total = Math.round(totals.total * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: "usd",
    payment_method_types: ["card"],
    metadata: {
      items: JSON.stringify(lines),
      discountAmount: totals.discount.toFixed(2),
      discountLabel: totals.discountLabel ?? '',
    },
  });

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret ?? "",
    publishableKey,
    totals,
  };
}

function normalizeCustomerDetails(customer: CheckoutCustomerDetails) {
  const parsed = customerDetailsSchema.safeParse(customer)
  if (!parsed.success) {
    throw new Error('Missing customer details for checkout.')
  }

  return {
    name: parsed.data.name,
    email: parsed.data.email,
    phone: parsed.data.phone?.trim() ?? "",
    address: parsed.data.address,
    city: parsed.data.city,
    state: parsed.data.state?.trim().toUpperCase() ?? "",
    postalCode: parsed.data.postalCode,
    country: parsed.data.country.toUpperCase(),
  };
}

async function getTrustedLineItemsFromPaymentIntent(paymentIntentId: string) {
  const parsedPaymentIntentId = paymentIntentIdSchema.safeParse(paymentIntentId)
  if (!parsedPaymentIntentId.success) {
    throw new Error('Checkout session was not found.')
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(parsedPaymentIntentId.data)

  let rawItems: unknown
  try {
    rawItems = JSON.parse(paymentIntent.metadata.items ?? '[]')
  } catch {
    throw new Error('Checkout session data is invalid.')
  }

  const parsedItems = z.array(trustedLineItemSchema).safeParse(rawItems)
  if (!parsedItems.success) {
    throw new Error('Checkout session data is invalid.')
  }

  if (!parsedItems.data.length) {
    throw new Error('No items were found for this checkout session.')
  }

  return { paymentIntent, items: parsedItems.data as TrustedLineItem[] }
}

function buildCustomerShippingMetadata(normalized: ReturnType<typeof normalizeCustomerDetails>) {
  return {
    customerName: normalized.name,
    customerEmail: normalized.email,
    customerPhone: normalized.phone,
    customerAddressLine1: normalized.address,
    customerCity: normalized.city,
    customerState: normalized.state,
    customerPostalCode: normalized.postalCode,
    customerCountry: normalized.country,
  }
}

function buildStripeCustomerUpdate(normalized: ReturnType<typeof normalizeCustomerDetails>) {
  return {
    receipt_email: normalized.email,
    shipping: {
      name: normalized.name,
      phone: normalized.phone || undefined,
      address: {
        line1: normalized.address,
        city: normalized.city,
        state: normalized.state || undefined,
        postal_code: normalized.postalCode,
        country: normalized.country,
      },
    },
  } satisfies Pick<Stripe.PaymentIntentUpdateParams, 'receipt_email' | 'shipping'>
}

function hasPersistedCustomerDetails(paymentIntent: Stripe.PaymentIntent) {
  const shipping = paymentIntent.shipping
  const metadata = paymentIntent.metadata

  return Boolean(
    shipping?.name?.trim() &&
    shipping.address?.line1?.trim() &&
    shipping.address?.city?.trim() &&
    shipping.address?.postal_code?.trim() &&
    shipping.address?.country?.trim() &&
    metadata.customerName?.trim() &&
    metadata.customerEmail?.trim() &&
    metadata.customerAddressLine1?.trim() &&
    metadata.customerCity?.trim() &&
    metadata.customerPostalCode?.trim() &&
    metadata.customerCountry?.trim()
  )
}

export async function quoteFedExShippingForPaymentIntent(
  paymentIntentId: string,
  customer: CheckoutCustomerDetails
) {
  let normalized: ReturnType<typeof normalizeCustomerDetails>
  try {
    normalized = normalizeCustomerDetails(customer)
  } catch {
    return { error: "Missing customer details for checkout." };
  }

  if (
    !paymentIntentId.trim() ||
    !normalized.name ||
    !normalized.email ||
    !normalized.address ||
    !normalized.city ||
    !normalized.postalCode ||
    !normalized.country
  ) {
    return { error: "Missing customer details for checkout." };
  }

  if (['US', 'CA'].includes(normalized.country) && !normalized.state) {
    return { error: 'State / province code is required for this destination.' }
  }

  const { paymentIntent, items } = await getTrustedLineItemsFromPaymentIntent(paymentIntentId)
  const totals = await calculateCheckoutTotals(items)

  await stripe.paymentIntents.update(paymentIntentId, {
    amount: Math.round(totals.total * 100),
    ...buildStripeCustomerUpdate(normalized),
    metadata: {
      items: JSON.stringify(items),
      ...buildCustomerShippingMetadata(normalized),
      discountAmount: totals.discount.toFixed(2),
      discountLabel: totals.discountLabel ?? '',
      fedexServiceType: '',
      fedexServiceName: '',
      fedexShippingAmount: '0.00',
      fedexShippingCurrency: 'USD',
      fedexDeliveryTimestamp: '',
      fedexTransitTime: '',
    },
  });

  const verifiedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (!hasPersistedCustomerDetails(verifiedPaymentIntent)) {
    return { error: 'We could not save your shipping address. Please try confirming your address again.' }
  }

  return {
    ok: true,
    totals,
    quote: null,
    paymentIntentId: paymentIntent.id,
  };
}

export async function updatePaymentIntentCustomerDetails(
  paymentIntentId: string,
  customer: CheckoutCustomerDetails
) {
  let normalized: ReturnType<typeof normalizeCustomerDetails>
  try {
    normalized = normalizeCustomerDetails(customer)
  } catch {
    return { error: "Missing customer details for checkout." };
  }

  if (
    !paymentIntentId.trim() ||
    !normalized.name ||
    !normalized.email ||
    !normalized.address ||
    !normalized.city ||
    !normalized.postalCode ||
    !normalized.country
  ) {
    return { error: "Missing customer details for checkout." };
  }

  if (['US', 'CA'].includes(normalized.country) && !normalized.state) {
    return { error: 'State / province code is required for this destination.' }
  }

  let paymentIntent: Stripe.PaymentIntent
  try {
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentIdSchema.parse(paymentIntentId))
  } catch {
    return { error: 'Checkout session was not found.' }
  }

  await stripe.paymentIntents.update(paymentIntentId, {
    amount: paymentIntent.amount,
    ...buildStripeCustomerUpdate(normalized),
    metadata: {
      items: paymentIntent.metadata.items ?? '[]',
      discountAmount: paymentIntent.metadata.discountAmount ?? '0.00',
      discountLabel: paymentIntent.metadata.discountLabel ?? '',
      ...buildCustomerShippingMetadata(normalized),
      fedexServiceType: '',
      fedexServiceName: '',
      fedexShippingAmount: '0.00',
      fedexShippingCurrency: 'USD',
      fedexDeliveryTimestamp: '',
      fedexTransitTime: '',
    },
  })

  const verifiedPaymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  if (!hasPersistedCustomerDetails(verifiedPaymentIntent)) {
    return { error: 'We could not save your shipping address. Please confirm your address again before paying.' }
  }

  return { ok: true };
}
