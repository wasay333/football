"use server";

import { headers } from "next/headers";
import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { getClientIpFromHeaders } from "@/lib/request-client";
import { hasMinimumFillTime, looksLikeSeoSpam } from "@/lib/spam-protection";
import { deleteUploadedFile, saveUploadedFile } from "@/lib/upload";

const MAX_REVIEW_IMAGES = 3;

const ReviewSchema = z.object({
  productId: z.string().min(1),
  name: z.string().trim().min(2, "Name must be at least 2 characters.").max(80),
  rating: z.coerce.number().int().min(1, "Please select a star rating.").max(5),
  body: z
    .string()
    .trim()
    .min(2, "Please enter your review.")
    .max(1000, "Review text must be 1000 characters or less."),
  website: z.string().max(0).optional().or(z.literal("")),
});

export async function submitReview(formData: FormData) {
  const requestHeaders = await headers();
  const clientIp = getClientIpFromHeaders(requestHeaders);
  const userAgent = requestHeaders.get("user-agent")?.trim().slice(0, 160) || "unknown";
  const imageEntries = formData.getAll("images");
  const imageFiles = imageEntries.filter(
    (entry): entry is File => entry instanceof File && entry.size > 0,
  );

  const result = ReviewSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    rating: formData.get("rating"),
    body: formData.get("body"),
    website: formData.get("website"),
  });

  if (!result.success) {
    return { error: result.error.issues[0]?.message ?? "Please fill in all fields and select a rating." };
  }

  if (imageEntries.length !== imageFiles.length) {
    return { error: "Please upload valid image files only." };
  }

  if (imageFiles.length > MAX_REVIEW_IMAGES) {
    return { error: `You can upload up to ${MAX_REVIEW_IMAGES} review photos.` };
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

  const uploadedImages: string[] = [];

  try {
    for (const file of imageFiles) {
      uploadedImages.push(await saveUploadedFile(file, "reviews/images"));
    }

    await prisma.review.create({
      data: {
        productId: result.data.productId,
        name: result.data.name,
        rating: result.data.rating,
        body: result.data.body,
        images: uploadedImages,
      },
    });
  } catch (error) {
    await Promise.all(uploadedImages.map((imagePath) => deleteUploadedFile(imagePath)));

    if (error instanceof Error) {
      return { error: error.message };
    }

    return { error: "We couldn't upload your review photos. Please try again." };
  }

  revalidatePath(`/product/${result.data.productId}`);
  return { success: true };
}
