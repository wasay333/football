"use server";

import { headers } from "next/headers";
import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIpFromHeaders } from "@/lib/request-client";
import { hasMinimumFillTime, looksLikeSeoSpam } from "@/lib/spam-protection";

const ReviewSchema = z.object({
  productId: z.string().min(1),
  name: z.string().trim().min(2).max(80),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(20).max(1000),
  website: z.string().max(0).optional().or(z.literal("")),
});

export async function submitReview(formData: FormData) {
  const requestHeaders = await headers();
  const clientIp = getClientIpFromHeaders(requestHeaders);
  const userAgent = requestHeaders.get("user-agent")?.trim().slice(0, 160) || "unknown";

  const result = ReviewSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    website: formData.get("website"),
  });

  if (!result.success) {
    return { error: "Please fill in all fields and select a rating." };
  }

  if (result.data.website || !hasMinimumFillTime(formData.get("startedAt"), 2000)) {
    return { success: true };
  }

  if (looksLikeSeoSpam([result.data.name, result.data.body])) {
    return { success: true };
  }

  const rateLimit = checkRateLimit({
    key: `review:${result.data.productId}:${clientIp}:${userAgent}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return { error: "Too many reviews were submitted from this connection. Please try again later." };
  }

  const productExists = await prisma.product.findUnique({
    where: { id: result.data.productId },
    select: { id: true, status: true },
  });

  if (!productExists || productExists.status !== "ACTIVE") {
    return { error: "This product is not available for reviews right now." };
  }

  await prisma.review.create({
    data: {
      productId: result.data.productId,
      name: result.data.name,
      rating: result.data.rating,
      body: result.data.body,
    },
  });

  revalidatePath(`/product/${result.data.productId}`);
  return { success: true };
}
