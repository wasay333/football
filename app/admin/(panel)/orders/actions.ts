'use server'

import { prisma } from '@/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const UpdateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  note: z.string().optional(),
})

export type UpdateStatusState = { error?: string } | null

export async function updateOrderStatusAction(
  orderId: string,
  _prev: UpdateStatusState,
  formData: FormData,
): Promise<UpdateStatusState> {
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
