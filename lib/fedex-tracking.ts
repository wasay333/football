import { fedexRequest } from '@/lib/fedex'

type FedExTrackRequest = {
  includeDetailedScans: boolean
  trackingInfo: Array<{
    trackingNumberInfo: {
      trackingNumber: string
    }
  }>
}

type FedExTrackResponse = {
  output?: {
    completeTrackResults?: Array<{
      trackResults?: Array<{
        trackingNumberInfo?: {
          trackingNumber?: string
        }
        latestStatusDetail?: {
          code?: string
          derivedCode?: string
          statusByLocale?: string
          description?: string
          scanLocation?: FedExLocation
        }
        serviceDetail?: {
          type?: string
          description?: string
          shortDescription?: string
        }
        estimatedDeliveryTimeWindow?: {
          window?: {
            begins?: string
            ends?: string
          }
        }
        dateAndTimes?: Array<{
          type?: string
          dateTime?: string
        }>
        scanEvents?: Array<{
          date?: string
          eventType?: string
          eventDescription?: string
          exceptionDescription?: string
          derivedStatus?: string
          scanLocation?: FedExLocation
          delayDetail?: {
            status?: string
            type?: string
            subType?: string
          }
        }>
      }>
    }>
  }
}

type FedExTrackResult = NonNullable<
  NonNullable<FedExTrackResponse['output']>['completeTrackResults']
>[number] & {
  trackResults?: Array<{
    trackingNumberInfo?: {
      trackingNumber?: string
    }
    latestStatusDetail?: {
      code?: string
      derivedCode?: string
      statusByLocale?: string
      description?: string
      scanLocation?: FedExLocation
    }
    serviceDetail?: {
      type?: string
      description?: string
      shortDescription?: string
    }
    estimatedDeliveryTimeWindow?: {
      window?: {
        begins?: string
        ends?: string
      }
    }
    dateAndTimes?: Array<{
      type?: string
      dateTime?: string
    }>
    scanEvents?: Array<{
      date?: string
      eventType?: string
      eventDescription?: string
      exceptionDescription?: string
      derivedStatus?: string
      scanLocation?: FedExLocation
      delayDetail?: {
        status?: string
        type?: string
        subType?: string
      }
    }>
  }>
}

type FedExLocation = {
  city?: string
  stateOrProvinceCode?: string
  countryCode?: string
  residential?: boolean
}

export type FedExTrackingEvent = {
  timestamp: string
  type: string
  description: string
  location: string
  delayStatus?: string
}

export type FedExTrackingSnapshot = {
  trackingNumber: string
  status: string
  statusCode: string
  service: string
  estimatedDeliveryDate?: string
  estimatedWindow?: {
    begins?: string
    ends?: string
  }
  lastLocation: string
  events: FedExTrackingEvent[]
}

function formatLocation(location?: FedExLocation) {
  if (!location) {
    return ''
  }

  return [location.city, location.stateOrProvinceCode, location.countryCode]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(', ')
}

function getEstimatedDeliveryDate(trackResult: NonNullable<FedExTrackResult['trackResults']>[number]) {
  const estimated = trackResult.dateAndTimes?.find((entry) =>
    ['ESTIMATED_DELIVERY', 'ACTUAL_DELIVERY', 'ACTUAL_TENDER'].includes(entry.type ?? ''),
  )

  return estimated?.dateTime
}

export async function trackFedExShipment(trackingNumber: string) {
  const normalizedTrackingNumber = trackingNumber.trim()
  if (!normalizedTrackingNumber) {
    throw new Error('Tracking number is required.')
  }

  const requestBody: FedExTrackRequest = {
    includeDetailedScans: true,
    trackingInfo: [
      {
        trackingNumberInfo: {
          trackingNumber: normalizedTrackingNumber,
        },
      },
    ],
  }

  const response = await fedexRequest<FedExTrackResponse>(
    '/track/v1/trackingnumbers',
    {
      method: 'POST',
      body: requestBody,
    },
    'tracking',
  )

  const trackResult = response.output?.completeTrackResults?.[0]?.trackResults?.[0]
  if (!trackResult) {
    throw new Error('FedEx did not return tracking details for this shipment.')
  }

  const latestStatus = trackResult.latestStatusDetail
  const events = (trackResult.scanEvents ?? [])
    .map((event) => ({
      timestamp: event.date ?? '',
      type: event.eventType ?? event.derivedStatus ?? 'UPDATE',
      description: event.eventDescription ?? event.exceptionDescription ?? 'Shipment update',
      location: formatLocation(event.scanLocation),
      delayStatus: event.delayDetail?.status,
    }))
    .sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1))

  return {
    trackingNumber: trackResult.trackingNumberInfo?.trackingNumber ?? normalizedTrackingNumber,
    status:
      latestStatus?.statusByLocale ??
      latestStatus?.description ??
      events[0]?.description ??
      'Status unavailable',
    statusCode: latestStatus?.derivedCode ?? latestStatus?.code ?? '',
    service:
      trackResult.serviceDetail?.description ??
      trackResult.serviceDetail?.shortDescription ??
      trackResult.serviceDetail?.type ??
      '',
    estimatedDeliveryDate: getEstimatedDeliveryDate(trackResult),
    estimatedWindow: trackResult.estimatedDeliveryTimeWindow?.window,
    lastLocation: formatLocation(latestStatus?.scanLocation) || events[0]?.location || '',
    events,
  } satisfies FedExTrackingSnapshot
}
