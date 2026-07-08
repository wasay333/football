import type { Order } from '@prisma/client'
import type { TrustedLineItem } from '@/app/(user)/checkout/_actions/create-payment-intent'
import { normalizeCountryCode } from '@/lib/country-code'
import { fedexRequest, getFedExConfig } from '@/lib/fedex'

type FedExContact = {
  name?: string
  phone?: string
}

type FedExAddress = {
  streetLines?: string[]
  city: string
  stateOrProvinceCode?: string
  postalCode: string
  countryCode: string
}

type FedExShipmentParty = {
  contact?: FedExContact
  address: FedExAddress
}

type FedExRateRequest = {
  accountNumber: { value: string }
  returnTransitTimes: boolean
  carrierCodes?: string[]
  rateSortOrder?: string
  requestedShipment: {
    shipper: { address: FedExAddress }
    recipient: { address: FedExAddress }
    shipDateStamp?: string
    pickupType: string
    packagingType: string
    serviceType?: string
    rateRequestType: string[]
    requestedPackageLineItems: Array<{
      weight: { units: string; value: number }
      dimensions?: { length: number; width: number; height: number; units: string }
    }>
  }
}

type FedExRateReply = {
  output?: {
    rateReplyDetails?: Array<{
      serviceType?: string
      serviceName?: string
      packagingType?: string
      deliveryTimestamp?: string
      transitTime?: string
      ratedShipmentDetails?: Array<{
        totalNetCharge?: { amount?: number | string; currency?: string } | number | string
        currency?: string
        shipmentRateDetail?: {
          totalNetCharge?: { amount?: number | string; currency?: string } | number | string
          currency?: string
        }
      }>
    }>
  }
}

type FedExShipReply = {
  output?: {
    transactionShipments?: Array<{
      masterTrackingNumber?: string
      pieceResponses?: Array<{
        trackingNumber?: string
        packageDocuments?: Array<{
          url?: string
          encodedLabel?: string
          contentType?: string
          docType?: string
        }>
      }>
      shipmentDocuments?: Array<{
        url?: string
        encodedLabel?: string
        contentType?: string
        type?: string
      }>
    }>
  }
}

export type FedExRateQuote = {
  serviceType: string
  serviceName: string
  packagingType: string
  amount: number
  currency: string
  deliveryTimestamp?: string
  transitTime?: string
}

export type FedExShipmentResult = {
  trackingNumber: string
  serviceType: string
  labelUrl?: string
  encodedLabel?: string
}

function readEnv(name: string, fallback?: string) {
  return process.env[name]?.trim() || fallback || ''
}

function readEnvList(name: string) {
  return (process.env[name] ?? '')
    .split(',')
    .map((value) => value.trim().toUpperCase())
    .filter(Boolean)
}

export function getConfiguredFedExServiceType() {
  return readEnv('FEDEX_DEFAULT_SERVICE_TYPE')
}

function readEnvNumber(name: string, fallback: number) {
  const value = Number(process.env[name])
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function getFedExShippingDefaults() {
  const packagingType = readEnv('FEDEX_PACKAGING_TYPE', 'YOUR_PACKAGING')
  const pickupType = readEnv('FEDEX_PICKUP_TYPE', 'DROPOFF_AT_FEDEX_LOCATION')
  const weightUnits = readEnv('FEDEX_WEIGHT_UNITS', 'LB')
  const dimensionsUnits = readEnv('FEDEX_DIMENSIONS_UNITS', 'IN')
  const itemWeight = readEnvNumber('FEDEX_ITEM_WEIGHT', 0.35)
  const minimumWeight = readEnvNumber('FEDEX_MIN_WEIGHT', 0.35)
  const length = Math.round(readEnvNumber('FEDEX_PACKAGE_LENGTH', 12))
  const width = Math.round(readEnvNumber('FEDEX_PACKAGE_WIDTH', 10))
  const height = Math.round(readEnvNumber('FEDEX_PACKAGE_HEIGHT', 8))

  return {
    packagingType,
    pickupType,
    weightUnits,
    dimensionsUnits,
    itemWeight,
    minimumWeight,
    length,
    width,
    height,
  }
}

function getFedExShipperParty(): FedExShipmentParty {
  const address = {
    streetLines: [readEnv('FEDEX_SHIPPER_ADDRESS_LINE_1')].filter(Boolean),
    city: readEnv('FEDEX_SHIPPER_CITY'),
    stateOrProvinceCode: readEnv('FEDEX_SHIPPER_STATE_OR_PROVINCE_CODE'),
    postalCode: readEnv('FEDEX_SHIPPER_POSTAL_CODE'),
    countryCode: readEnv('FEDEX_SHIPPER_COUNTRY_CODE'),
  }

  if (!address.city || !address.postalCode || !address.countryCode) {
    throw new Error('FedEx shipper origin env vars are incomplete.')
  }

  if (['US', 'CA'].includes(address.countryCode) && !address.stateOrProvinceCode) {
    throw new Error('FEDEX_SHIPPER_STATE_OR_PROVINCE_CODE is required for US/CA shipper addresses.')
  }

  return {
    contact: {
      name: readEnv('FEDEX_SHIPPER_NAME', 'Foocaps'),
      phone: readEnv('FEDEX_SHIPPER_PHONE'),
    },
    address,
  }
}

function buildPackageLineItems(totalQuantity: number) {
  const defaults = getFedExShippingDefaults()
  const totalWeight = Number(Math.max(defaults.itemWeight * totalQuantity, defaults.minimumWeight).toFixed(2))

  return [
    {
      weight: {
        units: defaults.weightUnits,
        value: totalWeight,
      },
      dimensions: {
        length: defaults.length,
        width: defaults.width,
        height: defaults.height,
        units: defaults.dimensionsUnits,
      },
    },
  ]
}

function getLineItemQuantity(lineItems: Array<{ quantity: number }>) {
  return Math.max(
    1,
    lineItems.reduce((sum, item) => sum + Math.max(0, item.quantity), 0),
  )
}

function normalizeAddress(address: FedExAddress): FedExAddress {
  const countryCode = normalizeCountryCode(address.countryCode)
  if (!countryCode) {
    throw new Error('Destination country code is invalid or missing. Please refer to documentation for valid format.')
  }

  return {
    streetLines: address.streetLines?.filter(Boolean),
    city: address.city.trim(),
    stateOrProvinceCode: address.stateOrProvinceCode?.trim().toUpperCase() || undefined,
    postalCode: address.postalCode.trim(),
    countryCode,
  }
}

function extractChargeAmount(detail: NonNullable<NonNullable<FedExRateReply['output']>['rateReplyDetails']>[number]) {
  for (const ratedDetail of detail.ratedShipmentDetails ?? []) {
    const charge =
      ratedDetail.shipmentRateDetail?.totalNetCharge ??
      ratedDetail.totalNetCharge
    const amount =
      typeof charge === 'number' || typeof charge === 'string'
        ? Number(charge)
        : Number(charge?.amount)
    if (Number.isFinite(amount)) {
      return {
        amount,
        currency:
          (typeof charge === 'object' ? charge?.currency : undefined) ||
          ratedDetail.shipmentRateDetail?.currency ||
          ratedDetail.currency ||
          'USD',
      }
    }
  }

  return null
}

export async function quoteFedExRates({
  recipient,
  lineItems,
}: {
  recipient: FedExAddress
  lineItems: Array<{ quantity: number }>
}) {
  const { accountNumber } = getFedExConfig()
  if (!accountNumber) {
    throw new Error('FEDEX_ACCOUNT_NUMBER is not set')
  }

  const shipper = getFedExShipperParty()
  const defaults = getFedExShippingDefaults()
  const configuredServiceType = getConfiguredFedExServiceType()
  const carrierCodes = readEnvList('FEDEX_RATE_CARRIER_CODES')
  const requestBody: FedExRateRequest = {
    accountNumber: { value: accountNumber },
    returnTransitTimes: true,
    carrierCodes: carrierCodes.length ? carrierCodes : undefined,
    rateSortOrder: 'LOWEST_COST',
    requestedShipment: {
      shipper: {
        address: normalizeAddress(shipper.address),
      },
      recipient: {
        address: normalizeAddress(recipient),
      },
      shipDateStamp: new Date().toISOString().slice(0, 10),
      pickupType: defaults.pickupType,
      packagingType: defaults.packagingType,
      serviceType: configuredServiceType || undefined,
      rateRequestType: ['ACCOUNT'],
      requestedPackageLineItems: buildPackageLineItems(getLineItemQuantity(lineItems)),
    },
  }

  const response = await fedexRequest<FedExRateReply>('/rate/v1/rates/quotes', {
    method: 'POST',
    body: requestBody,
  })

  const quotes = (response.output?.rateReplyDetails ?? [])
    .flatMap((detail) => {
      const charge = extractChargeAmount(detail)
      if (!detail.serviceType || !charge) {
        return []
      }

      return [{
        serviceType: detail.serviceType,
        serviceName: detail.serviceName ?? detail.serviceType,
        packagingType: detail.packagingType ?? defaults.packagingType,
        amount: charge.amount,
        currency: charge.currency,
        deliveryTimestamp: detail.deliveryTimestamp,
        transitTime: detail.transitTime,
      } satisfies FedExRateQuote]
    })
    .sort((a, b) => a.amount - b.amount)

  if (!quotes.length) {
    throw new Error('FedEx did not return any shipping rates for this destination.')
  }

  return quotes
}

function buildShipmentPartyFromOrder(order: Order): FedExShipmentParty {
  return {
    contact: {
      name: order.customerName,
      phone: order.customerPhone || "2025550100"
    },
    address: normalizeAddress({
      streetLines: [order.address],
      city: order.city,
      stateOrProvinceCode: order.stateOrProvinceCode ?? undefined,
      postalCode: order.postalCode,
      countryCode: order.country,
    }),
  }
}

export async function createFedExShipment({
  order,
  itemQuantity,
  recipientStateOrProvinceCode,
  serviceType,
}: {
  order: Order
  itemQuantity: number
  recipientStateOrProvinceCode?: string
  serviceType: string
}) {
  const { accountNumber } = getFedExConfig()
  if (!accountNumber) {
    throw new Error('FEDEX_ACCOUNT_NUMBER is not set')
  }

  const defaults = getFedExShippingDefaults()
  const shipper = getFedExShipperParty()
  const recipient = buildShipmentPartyFromOrder(order)
  recipient.address.stateOrProvinceCode = recipientStateOrProvinceCode?.trim().toUpperCase() || undefined

  if (['US', 'CA'].includes(recipient.address.countryCode) && !recipient.address.stateOrProvinceCode) {
    throw new Error('Recipient state / province code is required for US/CA shipments.')
  }
  const response = await fedexRequest<FedExShipReply>('/ship/v1/shipments', {
    method: 'POST',
    body: {
      labelResponseOptions: 'LABEL',
      accountNumber: { value: accountNumber },
      requestedShipment: {
        shipDateStamp: new Date().toISOString().slice(0, 10),
        pickupType: defaults.pickupType,
        serviceType,
        packagingType: defaults.packagingType,
        shippingChargesPayment: {
          paymentType: 'SENDER',
        },
        shipper: {
          contact: {
            personName: shipper.contact?.name,
            phoneNumber: shipper.contact?.phone,
            companyName: shipper.contact?.name,
          },
          address: shipper.address,
        },
        recipients: [
          {
            contact: {
              personName: recipient.contact?.name || order.customerName,
              phoneNumber: recipient.contact?.phone,
            },
            address: recipient.address,
          },
        ],
        labelSpecification: {
          imageType: readEnv('FEDEX_LABEL_IMAGE_TYPE', 'PDF'),
          labelStockType: readEnv('FEDEX_LABEL_STOCK_TYPE', 'PAPER_4X6'),
        },
        requestedPackageLineItems: buildPackageLineItems(Math.max(1, itemQuantity)),
      },
    },
  })

  const shipment = response.output?.transactionShipments?.[0]
  const piece = shipment?.pieceResponses?.[0]
  const document = piece?.packageDocuments?.[0] ?? shipment?.shipmentDocuments?.[0]
  const trackingNumber = piece?.trackingNumber ?? shipment?.masterTrackingNumber

  if (!trackingNumber) {
    throw new Error('FedEx created a shipment but did not return a tracking number.')
  }

  return {
    trackingNumber,
    serviceType,
    labelUrl: document?.url,
    encodedLabel: document?.encodedLabel,
  } satisfies FedExShipmentResult
}

export async function selectCheapestFedExRateForItems({
  recipient,
  items,
}: {
  recipient: FedExAddress
  items: TrustedLineItem[]
}) {
  const quotes = await quoteFedExRates({
    recipient,
    lineItems: items.map((item) => ({ quantity: item.quantity })),
  })

  const cheapestQuote = quotes[0]
  if (!cheapestQuote) {
    throw new Error('FedEx did not return any shipping rates for this destination.')
  }

  return cheapestQuote
}
