'use server'

import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'
import {
  createFedExShipment,
  getConfiguredFedExServiceType,
  selectCheapestFedExRateForItems,
} from '@/lib/fedex-shipping'
import { buildShipmentCreatedEmail } from '@/lib/email/shipment-created'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/prisma'

export type CreateFedExShipmentState =
  | {
      error?: string
      success?: string
      labelPath?: string
    }
  | null

export async function createFedExShipmentAction(
  orderId: string,
  _prevState: CreateFedExShipmentState,
): Promise<CreateFedExShipmentState> {
  void _prevState

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) {
    return { error: 'Order not found.' }
  }

  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
    return { error: 'Cannot create a FedEx shipment for a cancelled or refunded order.' }
  }

  if (order.trackingNumber || order.shippingLabelBase64) {
    return { error: 'A FedEx shipment has already been created for this order.' }
  }

  let hasDownloadableLabel = false

  try {
    let recipientStateOrProvinceCode = ''
    if (order.paymentIntentId) {
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId)
        recipientStateOrProvinceCode =
          paymentIntent.shipping?.address?.state?.trim().toUpperCase() ||
          paymentIntent.metadata.customerState?.trim().toUpperCase() ||
          ''
      } catch {
        recipientStateOrProvinceCode = ''
      }
    }

    if (['US', 'CA'].includes(order.country.toUpperCase()) && !recipientStateOrProvinceCode) {
      return { error: 'This order is missing a recipient state / province code, so FedEx cannot create the shipment yet.' }
    }

    const configuredServiceType = getConfiguredFedExServiceType()
    const selectedRate = configuredServiceType
      ? {
          serviceType: configuredServiceType,
          serviceName: configuredServiceType,
        }
      : await selectCheapestFedExRateForItems({
          recipient: {
            city: order.city,
            postalCode: order.postalCode,
            countryCode: order.country,
            streetLines: [order.address],
          },
          items: order.items.map((item) => ({
            productId: item.productId,
            name: item.productName,
            price: Number(item.unitPrice),
            quantity: item.quantity,
            size: item.size,
            image: item.productImage,
            isPreorder: item.isPreorder,
          })),
        })

    const shipment = await createFedExShipment({
      order,
      itemQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      recipientStateOrProvinceCode,
      serviceType: selectedRate.serviceType,
    })

    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber: shipment.trackingNumber,
        shippingLabelBase64: shipment.encodedLabel || undefined,
      },
    })

    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        status: order.status,
        note: [
          `FedEx label created`,
          `service: ${selectedRate.serviceName}`,
          `tracking: ${shipment.trackingNumber}`,
          shipment.labelUrl ? `label: ${shipment.labelUrl}` : null,
        ]
          .filter(Boolean)
          .join(' - '),
      },
    })

    await sendShipmentCreatedEmail({
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      orderNumber: order.orderNumber,
      trackingNumber: shipment.trackingNumber,
      serviceName: selectedRate.serviceName,
    })

    hasDownloadableLabel = Boolean(shipment.encodedLabel || shipment.labelUrl)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create FedEx shipment.'
    return { error: message }
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')

  return {
    success: 'FedEx shipment created successfully. Tracking details were added to the order history.',
    labelPath: hasDownloadableLabel ? `/admin/orders/${orderId}/label` : undefined,
  }
}

async function sendShipmentCreatedEmail({
  customerEmail,
  customerName,
  orderNumber,
  trackingNumber,
  serviceName,
}: {
  customerEmail: string
  customerName: string
  orderNumber: string
  trackingNumber: string
  serviceName: string
}) {
  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? 'Foocaps <onboarding@resend.dev>'

  if (!resendApiKey) {
    console.error(`FedEx shipment created for ${orderNumber}, but RESEND_API_KEY is missing so no shipment email was sent.`)
    return
  }

  if (!customerEmail?.trim()) {
    console.error(`FedEx shipment created for ${orderNumber}, but customer email is missing so no shipment email was sent.`)
    return
  }

  try {
    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from: resendFromEmail,
      to: customerEmail,
      subject: `Your Foocaps shipment is ready - ${orderNumber}`,
      html: buildShipmentCreatedEmail({
        customerEmail,
        customerName,
        orderNumber,
        trackingNumber,
        serviceName,
      }),
    })
  } catch (error) {
    console.error(`Failed to send shipment-created email for ${orderNumber}:`, error)
  }
}
