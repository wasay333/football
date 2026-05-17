'use server'

import { prisma } from '@/prisma'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { ALL_ORDER_STATUSES } from '@/lib/order-workflow'
import { getAdminSession } from '@/lib/admin-session'

const UpdateStatusSchema = z.object({
  status: z.enum(ALL_ORDER_STATUSES),
  note: z.string().optional(),
})

export type UpdateStatusState = { error?: string } | null

export async function updateOrderStatusAction(
  orderId: string,
  _prev: UpdateStatusState,
  formData: FormData,
): Promise<UpdateStatusState> {
  if (!(await getAdminSession())) {
    redirect('/admin/auth/login')
  }

  const result = UpdateStatusSchema.safeParse({
    status: formData.get('status'),
    note: formData.get('note') || undefined,
  })

  if (!result.success) return { error: 'Invalid status.' }

  try {
    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: result.data.status },
      }),
      prisma.orderStatusHistory.create({
        data: {
          orderId,
          status: result.data.status,
          note: result.data.note ?? null,
        },
      }),
    ])
  } catch {
    return { error: 'Failed to update order status.' }
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  return null
}
