'use server'

import { z } from 'zod'
import { prisma } from '@/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { saveUploadedFile, deleteUploadedFile } from '@/lib/upload'

const ProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Only lowercase letters, numbers and hyphens'),
  description: z.string().min(1, 'Description is required'),
  price: z.coerce.number().positive('Must be a positive number'),
  stock: z.coerce.number().int().min(0, 'Cannot be negative'),
  lowStockThreshold: z.coerce.number().int().min(0).default(5),
  allowPreorder: z.boolean().default(false),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  categoryId: z.string().nullable().optional(),
  footballerId: z.string().min(1, 'Footballer is required'),
  sizes: z
    .string()
    .transform((val) => {
      try { return JSON.parse(val) as string[] } catch { return [] }
    })
    .pipe(z.array(z.string().min(1)).default([])),
  capImage1: z.string().optional(),
  capImage2: z.string().optional(),
  capImage3: z.string().optional(),
})

export type ProductFormState = {
  errors?: {
    name?: string[]
    slug?: string[]
    description?: string[]
    price?: string[]
    stock?: string[]
    lowStockThreshold?: string[]
    footballerId?: string[]
    capImage1?: string[]
    capImage2?: string[]
    capImage3?: string[]
    form?: string[]
  }
} | null

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  // Validate text fields first — no point uploading files if they fail
  const textResult = ProductSchema.omit({ capImage1: true, capImage2: true, capImage3: true }).safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    price: formData.get('price'),
    stock: formData.get('stock'),
    lowStockThreshold: formData.get('lowStockThreshold') || 5,
    allowPreorder: formData.get('allowPreorder') === 'on',
    status: formData.get('status'),
    categoryId: formData.get('categoryId') || null,
    footballerId: formData.get('footballerId'),
    sizes: formData.get('sizes') || '[]',
  })
  if (!textResult.success) {
    return { errors: textResult.error.flatten().fieldErrors }
  }

  // Text fields valid — now save images
  let capImage1: string | null = null
  let capImage2: string | null = null
  let capImage3: string | null = null

  try {
    const f1 = formData.get('capImage1') as File | null
    const f2 = formData.get('capImage2') as File | null
    const f3 = formData.get('capImage3') as File | null
    if (f1?.size) capImage1 = await saveUploadedFile(f1, 'products/images')
    if (f2?.size) capImage2 = await saveUploadedFile(f2, 'products/images')
    if (f3?.size) capImage3 = await saveUploadedFile(f3, 'products/images')
  } catch {
    return { errors: { form: ['Failed to save uploaded images. Please try again.'] } }
  }

  try {
    await prisma.product.create({
      data: {
        name: textResult.data.name,
        slug: textResult.data.slug,
        description: textResult.data.description,
        price: textResult.data.price,
        stock: textResult.data.stock,
        lowStockThreshold: textResult.data.lowStockThreshold,
        allowPreorder: textResult.data.allowPreorder,
        status: textResult.data.status,
        footballerId: textResult.data.footballerId,
        categoryId: textResult.data.categoryId ?? null,
        sizes: textResult.data.sizes,
        capImage1,
        capImage2,
        capImage3,
      },
    })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err?.code === 'P2002') {
      return { errors: { slug: ['A product with this slug already exists'] } }
    }
    return { errors: { form: ['Failed to create product. Please try again.'] } }
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function updateProductAction(
  id: string,
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  // Fetch current image paths so we can delete replaced files afterwards
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { capImage1: true, capImage2: true, capImage3: true },
  })

  // Validate text fields before uploading anything
  const textResult = ProductSchema.omit({ capImage1: true, capImage2: true, capImage3: true }).safeParse({
    name: formData.get('name'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    price: formData.get('price'),
    stock: formData.get('stock'),
    lowStockThreshold: formData.get('lowStockThreshold') || 5,
    allowPreorder: formData.get('allowPreorder') === 'on',
    status: formData.get('status'),
    categoryId: formData.get('categoryId') || null,
    footballerId: formData.get('footballerId'),
    sizes: formData.get('sizes') || '[]',
  })
  if (!textResult.success) {
    return { errors: textResult.error.flatten().fieldErrors }
  }

  let capImage1: string | null = null
  let capImage2: string | null = null
  let capImage3: string | null = null
  const newlyUploaded: string[] = []
  const filesToDelete: (string | null | undefined)[] = []

  try {
    const f1 = formData.get('capImage1') as File | null
    const f2 = formData.get('capImage2') as File | null
    const f3 = formData.get('capImage3') as File | null

    if (f1?.size) { capImage1 = await saveUploadedFile(f1, 'products/images'); newlyUploaded.push(capImage1); filesToDelete.push(existing?.capImage1) }
    else          { capImage1 = (formData.get('capImage1_existing') as string) || null }

    if (f2?.size) { capImage2 = await saveUploadedFile(f2, 'products/images'); newlyUploaded.push(capImage2); filesToDelete.push(existing?.capImage2) }
    else          { capImage2 = (formData.get('capImage2_existing') as string) || null }

    if (f3?.size) { capImage3 = await saveUploadedFile(f3, 'products/images'); newlyUploaded.push(capImage3); filesToDelete.push(existing?.capImage3) }
    else          { capImage3 = (formData.get('capImage3_existing') as string) || null }
  } catch {
    await Promise.all(newlyUploaded.map(deleteUploadedFile))
    return { errors: { form: ['Failed to save uploaded images. Please try again.'] } }
  }

  try {
    await prisma.product.update({
      where: { id },
      data: {
        name: textResult.data.name,
        slug: textResult.data.slug,
        description: textResult.data.description,
        price: textResult.data.price,
        stock: textResult.data.stock,
        lowStockThreshold: textResult.data.lowStockThreshold,
        allowPreorder: textResult.data.allowPreorder,
        status: textResult.data.status,
        footballerId: textResult.data.footballerId,
        categoryId: textResult.data.categoryId ?? null,
        sizes: textResult.data.sizes,
        capImage1,
        capImage2,
        capImage3,
      },
    })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err?.code === 'P2002') {
      return { errors: { slug: ['A product with this slug already exists'] } }
    }
    return { errors: { form: ['Failed to update product. Please try again.'] } }
  }

  // Delete replaced files after successful DB update
  await Promise.all(filesToDelete.map(deleteUploadedFile))

  revalidatePath('/admin/products')
  redirect('/admin/products')
}

export async function updateProductStatusAction(
  id: string,
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED',
) {
  await prisma.product.update({ where: { id }, data: { status } })
  revalidatePath('/admin/products')
}

export async function deleteProductAction(id: string): Promise<{ error?: string }> {
  // Fetch image paths before deleting the record
  const existing = await prisma.product.findUnique({
    where: { id },
    select: { capImage1: true, capImage2: true, capImage3: true },
  })

  try {
    await prisma.product.delete({ where: { id } })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err?.code === 'P2003') {
      return { error: 'Cannot delete — this product has existing orders.' }
    }
    return { error: 'Failed to delete product. Please try again.' }
  }

  // Remove all associated images after successful DB delete
  if (existing) {
    await Promise.all(
      [existing.capImage1, existing.capImage2, existing.capImage3].map(deleteUploadedFile)
    )
  }

  revalidatePath('/admin/products')
  redirect('/admin/products')
}
