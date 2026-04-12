"use server";

import { prisma } from "@/prisma";
import { revalidatePath } from "next/cache";

export async function submitReview(formData: FormData) {
  const productId = formData.get("productId") as string;
  const name = (formData.get("name") as string)?.trim();
  const rating = Number(formData.get("rating"));
  const body = (formData.get("body") as string)?.trim();

  if (!productId || !name || !body || rating < 1 || rating > 5) {
    return { error: "Please fill in all fields and select a rating." };
  }

  await prisma.review.create({
    data: { productId, name, rating, body },
  });

  revalidatePath(`/product/${productId}`);
  return { success: true };
}
