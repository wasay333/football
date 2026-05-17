import { NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/admin-session'
import { extractFedExLabelUrlFromNotes, getFedExLabelFileExtension, getFedExLabelMimeType } from '@/lib/fedex-label'
import { prisma } from '@/prisma'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  if (!(await getAdminSession())) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      orderNumber: true,
      shippingLabelBase64: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        select: { note: true },
      },
    },
  })

  if (!order) {
    return new NextResponse('Order not found.', { status: 404 })
  }

  if (order.shippingLabelBase64) {
    const fileExtension = getFedExLabelFileExtension()
    const mimeType = getFedExLabelMimeType()
    const buffer = Buffer.from(order.shippingLabelBase64, 'base64')

    return new NextResponse(buffer, {
      headers: {
        'content-type': mimeType,
        'content-disposition': `inline; filename="${order.orderNumber}-fedex-label.${fileExtension}"`,
        'cache-control': 'no-store',
      },
    })
  }

  const labelUrl = extractFedExLabelUrlFromNotes(order.statusHistory.map((entry) => entry.note))
  if (labelUrl) {
    return NextResponse.redirect(labelUrl)
  }

  return new NextResponse('FedEx label is not available for this order yet.', { status: 404 })
}
