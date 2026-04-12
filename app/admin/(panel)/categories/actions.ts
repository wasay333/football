'use server'

import { z } from 'zod'
import { prisma } from '@/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const CategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Only lowercase letters, numbers and hyphens'),
})

export type CategoryFormState = {
  errors?: { name?: string[]; slug?: string[]; form?: string[] }
} | null

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const raw = {
    name: formData.get('name'),
    slug: formData.get('slug') || slugify(String(formData.get('name') ?? '')),
  }

  const result = CategorySchema.safeParse(raw)
  if (!result.success) return { errors: result.error.flatten().fieldErrors }

  try {
    await prisma.category.create({ data: result.data })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err?.code === 'P2002') return { errors: { slug: ['A category with this name or slug already exists'] } }
    return { errors: { form: ['Failed to create category.'] } }
  }

  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export async function updateCategoryAction(
  id: string,
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const raw = {
    name: formData.get('name'),
    slug: formData.get('slug') || slugify(String(formData.get('name') ?? '')),
  }

  const result = CategorySchema.safeParse(raw)
  if (!result.success) return { errors: result.error.flatten().fieldErrors }

  try {
    await prisma.category.update({ where: { id }, data: result.data })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err?.code === 'P2002') return { errors: { slug: ['A category with this name or slug already exists'] } }
    return { errors: { form: ['Failed to update category.'] } }
  }

  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}

export async function deleteCategoryAction(id: string): Promise<{ error?: string }> {
  try {
    await prisma.category.delete({ where: { id } })
  } catch (e: unknown) {
    const err = e as { code?: string }
    if (err?.code === 'P2003') return { error: 'Cannot delete — products are using this category.' }
    return { error: 'Failed to delete category.' }
  }

  revalidatePath('/admin/categories')
  redirect('/admin/categories')
}
