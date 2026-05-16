"use server";

import Stripe from 'stripe'
import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";
import { selectCheapestFedExRateForItems } from '@/lib/fedex-shipping'

export type CartLineInput = {
  productId: string;
  quantity: number;
  size?: string;
};

// Shape stored in PaymentIntent metadata — prices come from DB, not the client
export type TrustedLineItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
  image: string;
  isPreorder: boolean;
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

export type CheckoutShippingQuote = {
  serviceType: string
  serviceName: string
  amount: number
  currency: string
  deliveryTimestamp?: string
  transitTime?: string
}

const FREE_SHIPPING_THRESHOLD = 100

export async function createPaymentIntent(inputs: CartLineInput[]) {
  if (!inputs.length) return { error: "Cart is empty" };

  // Fetch all products in one query — server is the source of truth for price
  const products = await prisma.product.findMany({
    where: { id: { in: inputs.map((i) => i.productId) } },
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

  for (const input of inputs) {
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
      size: input.size ?? null,
      image: product.mannequinImage ?? product.capImage1 ?? "",
      isPreorder: product.stock === 0 && product.allowPreorder,
    });
  }

  const subtotalPence = Math.round(
    lines.reduce((s, i) => s + i.price * i.quantity, 0) * 100
  );
  const total = subtotalPence;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: "usd",
    payment_method_types: ["card"],
    metadata: {
      items: JSON.stringify(lines),
    },
  });

  const subtotal = subtotalPence / 100;

  return {
    paymentIntentId: paymentIntent.id,
    clientSecret: paymentIntent.client_secret ?? "",
    totals: { subtotal, shipping: 0, total: subtotal },
  };
}

function normalizeCustomerDetails(customer: CheckoutCustomerDetails) {
  return {
    name: customer.name.trim(),
    email: customer.email.trim(),
    phone: customer.phone?.trim() ?? "",
    address: customer.address.trim(),
    city: customer.city.trim(),
    state: customer.state?.trim().toUpperCase() ?? "",
    postalCode: customer.postalCode.trim(),
    country: customer.country.trim().toUpperCase(),
  };
}

async function getTrustedLineItemsFromPaymentIntent(paymentIntentId: string) {
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  const items: TrustedLineItem[] = JSON.parse(paymentIntent.metadata.items ?? '[]')

  if (!items.length) {
    throw new Error('No items were found for this checkout session.')
  }

  return { paymentIntent, items }
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

export async function quoteFedExShippingForPaymentIntent(
  paymentIntentId: string,
  customer: CheckoutCustomerDetails
) {
  const normalized = normalizeCustomerDetails(customer)

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
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const subtotalCents = Math.round(subtotal * 100)

  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    await stripe.paymentIntents.update(paymentIntentId, {
      amount: subtotalCents,
      ...buildStripeCustomerUpdate(normalized),
      metadata: {
        ...buildCustomerShippingMetadata(normalized),
        fedexServiceType: '',
        fedexServiceName: '',
        fedexShippingAmount: '0.00',
        fedexShippingCurrency: 'USD',
        fedexDeliveryTimestamp: '',
        fedexTransitTime: '',
      },
    })

    return {
      ok: true,
      totals: {
        subtotal,
        shipping: 0,
        total: subtotal,
      },
      quote: null,
      paymentIntentId: paymentIntent.id,
    }
  }

  let quote: CheckoutShippingQuote
  try {
    quote = await selectCheapestFedExRateForItems({
      recipient: {
        city: normalized.city,
        stateOrProvinceCode: normalized.state || undefined,
        postalCode: normalized.postalCode,
        countryCode: normalized.country,
        streetLines: [normalized.address],
      },
      items,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'FedEx shipping quote failed.'
    return { error: message }
  }

  const shippingCents = Math.round(quote.amount * 100)
  const totalCents = subtotalCents + shippingCents

  await stripe.paymentIntents.update(paymentIntentId, {
    amount: totalCents,
    ...buildStripeCustomerUpdate(normalized),
    metadata: {
      ...buildCustomerShippingMetadata(normalized),
      fedexServiceType: quote.serviceType,
      fedexServiceName: quote.serviceName,
      fedexShippingAmount: quote.amount.toFixed(2),
      fedexShippingCurrency: quote.currency,
      fedexDeliveryTimestamp: quote.deliveryTimestamp ?? '',
      fedexTransitTime: quote.transitTime ?? '',
    },
  });

  const updatedIntent = paymentIntent.id
    ? await stripe.paymentIntents.retrieve(paymentIntentId)
    : paymentIntent

  return {
    ok: true,
    totals: {
      subtotal,
      shipping: quote.amount,
      total: subtotal + quote.amount,
    },
    quote,
    paymentIntentId: updatedIntent.id,
  };
}

export async function updatePaymentIntentCustomerDetails(
  paymentIntentId: string,
  customer: CheckoutCustomerDetails
) {
  const normalized = normalizeCustomerDetails(customer)

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
    paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
  } catch {
    return { error: 'Checkout session was not found.' }
  }

  if (!paymentIntent.metadata.fedexServiceType || !paymentIntent.metadata.fedexShippingAmount) {
    const { items } = await getTrustedLineItemsFromPaymentIntent(paymentIntentId)
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    if (subtotal < FREE_SHIPPING_THRESHOLD) {
      return { error: 'Please calculate shipping before paying.' }
    }

    await stripe.paymentIntents.update(paymentIntentId, {
      amount: Math.round(subtotal * 100),
      ...buildStripeCustomerUpdate(normalized),
      metadata: {
        ...buildCustomerShippingMetadata(normalized),
        fedexServiceType: '',
        fedexServiceName: '',
        fedexShippingAmount: '0.00',
        fedexShippingCurrency: 'USD',
        fedexDeliveryTimestamp: '',
        fedexTransitTime: '',
      },
    })

    return { ok: true }
  }

  await stripe.paymentIntents.update(paymentIntentId, {
    ...buildStripeCustomerUpdate(normalized),
    metadata: {
      ...buildCustomerShippingMetadata(normalized),
      fedexServiceType: paymentIntent.metadata.fedexServiceType ?? '',
      fedexServiceName: paymentIntent.metadata.fedexServiceName ?? '',
      fedexShippingAmount: paymentIntent.metadata.fedexShippingAmount ?? '',
      fedexShippingCurrency: paymentIntent.metadata.fedexShippingCurrency ?? 'USD',
      fedexDeliveryTimestamp: paymentIntent.metadata.fedexDeliveryTimestamp ?? '',
      fedexTransitTime: paymentIntent.metadata.fedexTransitTime ?? '',
    },
  })

  return { ok: true };
}
