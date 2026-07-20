'use server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'
import {
  createFedExShipment,
  getConfiguredFedExServiceType,
  selectCheapestFedExRateForItems,
} from '@/lib/fedex-shipping'
import { normalizeCountryCode } from '@/lib/country-code'
import { getOptionalServerEnv } from '@/lib/env.server'
import { buildShipmentCreatedEmail } from '@/lib/email/shipment-created'
import { getShipmentAvailability } from '@/lib/order-workflow'
import { allocatePreorderOrder, PreorderAllocationError } from '@/lib/preorder-allocation'
import { syncOrderFromPaymentIntent } from '@/lib/stripe-order-sync'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/prisma'
import { getAdminSession } from '@/lib/admin-session'

export type AllocatePreorderState =
  | {
      error?: string
      success?: string
    }
  | null

export type CreateFedExShipmentState =
  | {
      error?: string
      success?: string
      labelPath?: string
    }
  | null

export async function resyncOrderFromStripeAction(orderId: string) {
  if (!(await getAdminSession())) {
    redirect('/admin/auth/login')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { paymentIntentId: true },
  })

  if (!order?.paymentIntentId) {
    throw new Error('This order is missing a Stripe payment intent.')
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId)
  const result = await syncOrderFromPaymentIntent(paymentIntent)
  if (!result.ok) {
    throw new Error(result.reason)
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
}

export async function allocatePreorderInventoryAction(
  orderId: string,
  _prevState: AllocatePreorderState,
): Promise<AllocatePreorderState> {
  void _prevState

  if (!(await getAdminSession())) {
    redirect('/admin/auth/login')
  }

  try {
    await prisma.$transaction(async (tx) => {
      await allocatePreorderOrder(tx, orderId)
    })
  } catch (error) {
    const message =
      error instanceof PreorderAllocationError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Failed to allocate inventory for this pre-order.'

    return { error: message }
  }

  revalidatePath(`/admin/orders/${orderId}`)
  revalidatePath('/admin/orders')
  revalidatePath('/product')
  revalidatePath('/collections')
  revalidatePath('/')

  return {
    success: 'Inventory allocated successfully. This pre-order is now ready for FedEx shipment creation.',
  }
}

export async function createFedExShipmentAction(
  orderId: string,
  _prevState: CreateFedExShipmentState,
): Promise<CreateFedExShipmentState> {
  void _prevState

  if (!(await getAdminSession())) {
    redirect('/admin/auth/login')
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  })

  if (!order) {
    return { error: 'Order not found.' }
  }

  const shipmentAvailability = getShipmentAvailability(order)
  if (!shipmentAvailability.canCreateShipment) {
    return { error: shipmentAvailability.reason }
  }

  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
    return { error: 'Cannot create a FedEx shipment for a cancelled or refunded order.' }
  }

  if (order.trackingNumber || order.shippingLabelBase64) {
    return { error: 'A FedEx shipment has already been created for this order.' }
  }

  let hasDownloadableLabel = false

  try {
    const paymentIntent = order.paymentIntentId
      ? await stripe.paymentIntents.retrieve(order.paymentIntentId).catch(() => null)
      : null
    const latestChargeId =
      typeof paymentIntent?.latest_charge === 'string'
        ? paymentIntent.latest_charge
        : paymentIntent?.latest_charge?.id
    const latestCharge = latestChargeId
      ? await stripe.charges.retrieve(latestChargeId).catch(() => null)
      : null

    const paymentIntentCountry = normalizeCountryCode(
      paymentIntent?.shipping?.address?.country ||
      paymentIntent?.metadata.customerCountry ||
      latestCharge?.billing_details?.address?.country,
    )
    const recipientCountryCode =
      normalizeCountryCode(order.country) ||
      paymentIntentCountry
    if (!recipientCountryCode) {
      return { error: 'This order is still missing a destination country from checkout, so FedEx shipment creation cannot continue.' }
    }

    let recipientStateOrProvinceCode = order.stateOrProvinceCode?.trim().toUpperCase() ?? ''
    if (!recipientStateOrProvinceCode && paymentIntent) {
      recipientStateOrProvinceCode =
        paymentIntent.shipping?.address?.state?.trim().toUpperCase() ||
        paymentIntent.metadata.customerState?.trim().toUpperCase() ||
        latestCharge?.billing_details?.address?.state?.trim().toUpperCase() ||
        ''
    }

    if (['US', 'CA'].includes(recipientCountryCode) && !recipientStateOrProvinceCode) {
      return { error: 'This order is missing a recipient state / province code, so FedEx cannot create the shipment yet.' }
    }

    const recipientAddress =
      order.address ||
      paymentIntent?.shipping?.address?.line1?.trim() ||
      paymentIntent?.metadata.customerAddressLine1?.trim() ||
      latestCharge?.billing_details?.address?.line1?.trim() ||
      ''
    const recipientCity =
      order.city ||
      paymentIntent?.shipping?.address?.city?.trim() ||
      paymentIntent?.metadata.customerCity?.trim() ||
      latestCharge?.billing_details?.address?.city?.trim() ||
      ''
    const recipientPostalCode =
      order.postalCode ||
      paymentIntent?.shipping?.address?.postal_code?.trim() ||
      paymentIntent?.metadata.customerPostalCode?.trim() ||
      latestCharge?.billing_details?.address?.postal_code?.trim() ||
      ''
    const recipientName = (order.customerName && order.customerName !== 'Guest'
      ? order.customerName
      : paymentIntent?.shipping?.name?.trim() ||
        paymentIntent?.metadata.customerName?.trim() ||
        latestCharge?.billing_details?.name?.trim() ||
        order.customerName)
    const recipientPhone =
      order.customerPhone ||
      paymentIntent?.shipping?.phone?.trim() ||
      paymentIntent?.metadata.customerPhone?.trim() ||
      latestCharge?.billing_details?.phone?.trim() ||
      ''

    if (!recipientAddress || !recipientCity || !recipientPostalCode) {
      return { error: 'This order is missing checkout address details, so FedEx shipment creation cannot continue yet.' }
    }

    const shipmentOrder = {
      ...order,
      customerName: recipientName,
      customerPhone: recipientPhone,
      address: recipientAddress,
      city: recipientCity,
      postalCode: recipientPostalCode,
      country: recipientCountryCode,
      stateOrProvinceCode: recipientStateOrProvinceCode || order.stateOrProvinceCode,
    }

    const persistedServiceType = order.shippingServiceType?.trim()
    const persistedServiceName = order.shippingServiceName?.trim()
    const configuredServiceType = getConfiguredFedExServiceType()
    const selectedRate = persistedServiceType
      ? {
          serviceType: persistedServiceType,
          serviceName: persistedServiceName || persistedServiceType,
        }
      : configuredServiceType
        ? {
            serviceType: configuredServiceType,
            serviceName: configuredServiceType,
          }
        : await selectCheapestFedExRateForItems({
          recipient: {
            city: recipientCity,
            stateOrProvinceCode: recipientStateOrProvinceCode || undefined,
            postalCode: recipientPostalCode,
            countryCode: recipientCountryCode,
            streetLines: [recipientAddress],
          },
          items: order.items.map((item) => ({
            productId: item.productId,
            name: item.productName,
            price: Number(item.unitPrice),
            quantity: item.quantity,
            image: item.productImage,
            isPreorder: item.isPreorder,
          })),
        })

    const shipment = await createFedExShipment({
      order: shipmentOrder,
      itemQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
      recipientStateOrProvinceCode,
      serviceType: selectedRate.serviceType,
    })

    await prisma.order.update({
      where: { id: order.id },
      data: {
        trackingNumber: shipment.trackingNumber,
        shippingLabelBase64: shipment.encodedLabel || undefined,
        customerName: recipientName,
        customerPhone: recipientPhone || undefined,
        address: recipientAddress,
        city: recipientCity,
        postalCode: recipientPostalCode,
        country: recipientCountryCode,
        stateOrProvinceCode: recipientStateOrProvinceCode || order.stateOrProvinceCode || undefined,
        shippingServiceType: selectedRate.serviceType,
        shippingServiceName: selectedRate.serviceName,
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
    console.error('FedEx shipment error:', error)
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
  const resendApiKey = getOptionalServerEnv('RESEND_API_KEY')
  const resendFromEmail = getOptionalServerEnv('RESEND_FROM_EMAIL') ?? 'Foocaps <onboarding@resend.dev>'

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
