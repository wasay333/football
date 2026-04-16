"use server";

import { stripe } from "@/lib/stripe";
import { prisma } from "@/prisma";

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
      image: product.capImage1 ?? "",
      isPreorder: product.stock === 0 && product.allowPreorder,
    });
  }

  const subtotalPence = Math.round(
    lines.reduce((s, i) => s + i.price * i.quantity, 0) * 100
  );
  const shippingPence = subtotalPence / 100 >= 100 ? 0 : Math.round(9.99 * 100);
  const total = subtotalPence + shippingPence;

  const paymentIntent = await stripe.paymentIntents.create({
    amount: total,
    currency: "usd",
    payment_method_types: ["card"],
    metadata: {
      items: JSON.stringify(lines),
    },
  });

  const subtotal = subtotalPence / 100;
  const shipping = shippingPence / 100;

  return {
    clientSecret: paymentIntent.client_secret ?? "",
    totals: { subtotal, shipping, total: subtotal + shipping },
  };
}
