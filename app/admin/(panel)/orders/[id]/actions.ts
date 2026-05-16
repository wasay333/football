'use server'

import { revalidatePath } from 'next/cache'
import {
  createFedExShipment,
  getConfiguredFedExServiceType,
  selectCheapestFedExRateForItems,
} from '@/lib/fedex-shipping'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/prisma'

export type CreateFedExShipmentState =
  | {
      error?: string
      success?: string
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
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create FedEx shipment.'
    return { error: message }
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')

  return { success: 'FedEx shipment created successfully. Tracking details were added to the order history.' }
}
