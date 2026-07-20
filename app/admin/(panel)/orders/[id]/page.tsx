import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { extractFedExLabelUrlFromNotes } from '@/lib/fedex-label'
import { trackFedExShipment } from '@/lib/fedex-tracking'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/prisma'
import { Badge } from '@/components/ui/badge'
import { TrackingSummary } from '@/components/tracking-summary'

export const dynamic = "force-dynamic";
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import type { OrderStatus } from '@prisma/client'
import { getShipmentAvailability } from '@/lib/order-workflow'
import { UpdateStatusForm } from './_components/update-status-form'
import { AllocatePreorderForm } from './_components/allocate-preorder-form'
import { CreateFedExShipmentForm } from './_components/create-fedex-shipment-form'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true } })
  return { title: order ? `Order ${order.orderNumber}` : 'Order' }
}

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  AWAITING_STOCK: 'secondary',
  READY_TO_SHIP: 'outline',
  CONFIRMED: 'default',
  PROCESSING: 'default',
  SHIPPED: 'default',
  DELIVERED: 'outline',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ liveTracking?: string }>
}) {
  const { id } = await params
  const query = await searchParams

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true } } } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!order) notFound()

  const hasStoredFedExLabel = Boolean(order.shippingLabelBase64)
  const legacyLabelUrl = extractFedExLabelUrlFromNotes(order.statusHistory.map((entry) => entry.note))
  const hasFedExLabel = hasStoredFedExLabel || Boolean(legacyLabelUrl)
  const shipmentAlreadyCreated = Boolean(order.trackingNumber || hasFedExLabel)
  const shipmentAvailability = getShipmentAvailability(order)
  const shouldLoadLiveTracking = query.liveTracking === '1'
  const liveTracking = order.trackingNumber && shouldLoadLiveTracking
    ? await trackFedExShipment(order.trackingNumber).catch(() => null)
    : null
  const latestPaymentIntent = order.paymentIntentId
    ? await stripe.paymentIntents.retrieve(order.paymentIntentId).catch(() => null)
    : null
  const latestChargeId =
    typeof latestPaymentIntent?.latest_charge === 'string'
      ? latestPaymentIntent.latest_charge
      : latestPaymentIntent?.latest_charge?.id
  const latestCharge = latestChargeId
    ? await stripe.charges.retrieve(latestChargeId).catch(() => null)
    : null
  const storedSubtotal = Number(order.subtotal)
  const storedDiscount = Number(order.discountAmount)
  const storedShipping = Number(order.shippingCost)
  const storedTotal = Number(order.total)
  const stripeMetadataShipping = Number(latestPaymentIntent?.metadata.fedexShippingAmount || 0)
  const stripeDerivedTotal = latestCharge
    ? roundCurrency(latestCharge.amount / 100)
    : latestPaymentIntent
      ? roundCurrency(latestPaymentIntent.amount / 100)
      : null
  const stripeDerivedShipping = latestPaymentIntent
    ? roundCurrency(stripeDerivedTotal! - storedSubtotal + storedDiscount)
    : null
  const displayShipping =
    storedShipping > 0
      ? storedShipping
      : stripeMetadataShipping > 0
        ? stripeMetadataShipping
        : stripeDerivedShipping && stripeDerivedShipping > 0
          ? stripeDerivedShipping
          : 0
  const displayTotal =
    storedTotal > storedSubtotal - storedDiscount
      ? storedTotal
      : stripeDerivedTotal && stripeDerivedTotal > storedTotal
        ? stripeDerivedTotal
        : storedTotal

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/orders">
            <ChevronLeft className="size-4" />
            Orders
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="font-semibold">{order.orderNumber}</h1>
        <Badge variant={statusVariant[order.status]} className="ml-2">{order.status}</Badge>
        {order.isPreorder && <Badge variant="outline" className="ml-1">Pre-order</Badge>}
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6 max-w-4xl">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Customer */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.customerName}</p>
              <p className="text-muted-foreground">{order.customerEmail}</p>
              {order.customerPhone && <p className="text-muted-foreground">{order.customerPhone}</p>}
            </CardContent>
          </Card>

          {/* Shipping address */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Shipping Address</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm text-muted-foreground">
              <p>{order.address}</p>
              <p>{order.city}, {order.postalCode}</p>
              <p>{order.country}</p>
            </CardContent>
          </Card>
        </div>

        {/* Items */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Items</CardTitle></CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Qty</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Unit Price</th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.productImage} alt={item.productName} className="h-10 w-10 rounded object-cover bg-muted" />
                        <div>
                          <p className="font-medium">{item.productName}</p>
                          {item.isPreorder && <span className="text-xs text-muted-foreground">Pre-order</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{item.quantity}</td>
                    <td className="px-4 py-3 text-right">${Number(item.unitPrice).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">${(Number(item.unitPrice) * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="border-t px-4 py-3 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span>
              </div>
              {Number(order.discountAmount) !== 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>{order.discountLabel || 'Price Rule'}</span>
                  <span>
                    {Number(order.discountAmount) > 0
                      ? `-$${Number(order.discountAmount).toFixed(2)}`
                      : `+$${Math.abs(Number(order.discountAmount)).toFixed(2)}`}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{displayShipping === 0 ? 'Free' : `$${displayShipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t">
                <span>Total</span><span>${displayTotal.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {order.isPreorder && (
          <Card>
            <CardHeader><CardTitle className="text-sm">Inventory Allocation</CardTitle></CardHeader>
            <CardContent>
              {order.status === 'AWAITING_STOCK' ? (
                <AllocatePreorderForm orderId={order.id} />
              ) : order.status === 'READY_TO_SHIP' ? (
                <p className="text-sm text-muted-foreground">
                  Inventory has already been allocated for this pre-order. You can create the FedEx shipment now.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Manual allocation is only available while this pre-order is in AWAITING_STOCK.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Update status */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Update Status</CardTitle></CardHeader>
            <CardContent>
              <UpdateStatusForm orderId={order.id} currentStatus={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">FedEx Shipment</CardTitle></CardHeader>
            <CardContent>
              {(order.trackingNumber || hasFedExLabel) && (
                <div className="mb-4 space-y-3 rounded-md border p-3 text-sm">
                  {order.trackingNumber && (
                    <p className="text-muted-foreground">
                      Tracking number: <span className="font-medium text-foreground">{order.trackingNumber}</span>
                    </p>
                  )}
                  {hasFedExLabel && (
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/admin/orders/${order.id}/label`} target="_blank" rel="noreferrer">
                          Download Label
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/admin/orders/${order.id}/label`} target="_blank" rel="noreferrer">
                          Print Label
                        </a>
                      </Button>
                    </div>
                  )}
                </div>
              )}
              {!shipmentAlreadyCreated && shipmentAvailability.canCreateShipment && (
                <CreateFedExShipmentForm orderId={order.id} shipmentAlreadyCreated={shipmentAlreadyCreated} />
              )}
              {!shipmentAlreadyCreated && !shipmentAvailability.canCreateShipment && shipmentAvailability.reason && (
                <p className="text-sm text-muted-foreground">{shipmentAvailability.reason}</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6">
          {order.trackingNumber && !shouldLoadLiveTracking && (
            <Card>
              <CardHeader><CardTitle className="text-sm">Live FedEx Tracking</CardTitle></CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/orders/${order.id}?liveTracking=1`}>Load Live Tracking</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {liveTracking && <TrackingSummary snapshot={liveTracking} />}

          {/* Status history */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Status History</CardTitle></CardHeader>
            <CardContent>
              {order.statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground">No history yet.</p>
              ) : (
                <ol className="space-y-3">
                  {order.statusHistory.map((h) => (
                    <li key={h.id} className="flex gap-3 text-sm">
                      <div className="flex flex-col items-center">
                        <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                        <div className="flex-1 w-px bg-border mt-1" />
                      </div>
                      <div className="pb-3">
                        <Badge variant={statusVariant[h.status]} className="text-xs">{h.status}</Badge>
                        {h.note && <p className="mt-1 text-muted-foreground">{h.note}</p>}
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {new Date(h.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
