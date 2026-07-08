'use server'

import { z } from 'zod'
import { prisma } from '@/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminSession } from '@/lib/admin-session'

const CheckoutDiscountRuleSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  itemCount: z.coerce.number().int().min(1, 'Item count must be at least 1').max(25),
  fixedTotal: z.coerce.number().positive('Fixed total must be greater than 0').max(100000),
  isActive: z.boolean(),
})

export type DiscountFormState = {
  errors?: {
    name?: string[]
    itemCount?: string[]
    fixedTotal?: string[]
    form?: string[]
  }
} | null

function parseDiscountForm(formData: FormData) {
  return CheckoutDiscountRuleSchema.safeParse({
    name: formData.get('name'),
    itemCount: formData.get('itemCount'),
    fixedTotal: formData.get('fixedTotal'),
    isActive: formData.get('isActive') === 'on',
  })
}

export async function createDiscountAction(
  _prev: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  if (!(await getAdminSession())) {
    redirect('/admin/auth/login')
  }

  const result = parseDiscountForm(formData)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  try {
    await prisma.checkoutDiscountRule.create({
      data: {
        ...result.data,
        fixedTotal: result.data.fixedTotal,
      },
    })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === 'P2002') {
      return { errors: { itemCount: ['A rule for this exact item count already exists.'] } }
    }
    return { errors: { form: ['Failed to create discount rule.'] } }
  }

  revalidatePath('/admin/discounts')
  redirect('/admin/discounts')
}

export async function updateDiscountAction(
  id: string,
  _prev: DiscountFormState,
  formData: FormData,
): Promise<DiscountFormState> {
  if (!(await getAdminSession())) {
    redirect('/admin/auth/login')
  }

  const result = parseDiscountForm(formData)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  try {
    await prisma.checkoutDiscountRule.update({
      where: { id },
      data: {
        ...result.data,
        fixedTotal: result.data.fixedTotal,
      },
    })
  } catch (error: unknown) {
    const err = error as { code?: string }
    if (err?.code === 'P2002') {
      return { errors: { itemCount: ['A rule for this exact item count already exists.'] } }
    }
    return { errors: { form: ['Failed to update discount rule.'] } }
  }

  revalidatePath('/admin/discounts')
  redirect('/admin/discounts')
}

export async function deleteDiscountAction(id: string): Promise<{ error?: string }> {
  if (!(await getAdminSession())) {
    redirect('/admin/auth/login')
  }

  try {
    await prisma.checkoutDiscountRule.delete({ where: { id } })
  } catch {
    return { error: 'Failed to delete discount rule.' }
  }

  revalidatePath('/admin/discounts')
  redirect('/admin/discounts')
}
