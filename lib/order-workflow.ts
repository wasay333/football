import type { OrderStatus } from '@prisma/client'

export const ALL_ORDER_STATUSES = [
  'PENDING',
  'AWAITING_STOCK',
  'READY_TO_SHIP',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const satisfies readonly OrderStatus[]

export function getInitialOrderStatus(isPreorder: boolean): OrderStatus {
  return isPreorder ? 'AWAITING_STOCK' : 'CONFIRMED'
}

export function getInitialOrderStatusNote(isPreorder: boolean, paymentIntentId: string, fedexServiceName?: string) {
  if (isPreorder) {
    return `Payment received via Stripe (${paymentIntentId}). This pre-order is waiting for stock before shipment can be created.`
  }

  if (fedexServiceName) {
    return `Payment received via Stripe (${paymentIntentId}). FedEx service selected: ${fedexServiceName}.`
  }

  return `Payment received via Stripe (${paymentIntentId})`
}

export function getShipmentAvailability(order: {
  isPreorder: boolean
  status: OrderStatus
  trackingNumber?: string | null
  shippingLabelBase64?: string | null
}) {
  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
    return {
      canCreateShipment: false,
      reason: 'Cannot create a FedEx shipment for a cancelled or refunded order.',
    }
  }

  if (order.trackingNumber || order.shippingLabelBase64) {
    return {
      canCreateShipment: false,
      reason: 'This order already has a FedEx shipment and label.',
    }
  }

  if (order.isPreorder) {
    if (order.status === 'READY_TO_SHIP') {
      return {
        canCreateShipment: true,
        reason: undefined,
      }
    }

    return {
      canCreateShipment: false,
      reason: 'This pre-order is still waiting for inventory allocation. FedEx shipment creation will unlock once the order reaches READY_TO_SHIP.',
    }
  }

  if (order.status === 'CONFIRMED' || order.status === 'PROCESSING') {
    return {
      canCreateShipment: true,
      reason: undefined,
    }
  }

  return {
    canCreateShipment: false,
    reason: 'FedEx shipment creation is available for standard orders only after they are confirmed or processing.',
  }
}
