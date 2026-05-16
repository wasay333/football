import { TrackingSummary } from '@/components/tracking-summary'
import { trackFedExShipment } from '@/lib/fedex-tracking'
import { prisma } from '@/prisma'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Track Order',
}

function normalizeOrderNumber(value?: string) {
  return value?.trim().toUpperCase() ?? ''
}

function normalizeEmail(value?: string) {
  return value?.trim().toLowerCase() ?? ''
}

export default async function TrackOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; email?: string }>
}) {
  const params = await searchParams
  const orderNumber = normalizeOrderNumber(params.order)
  const email = normalizeEmail(params.email)

  let errorMessage = ''
  let order:
    | {
        orderNumber: string
        customerName: string
        status: string
        trackingNumber: string | null
        address: string
        city: string
        postalCode: string
        country: string
      }
    | null = null
  let snapshot: Awaited<ReturnType<typeof trackFedExShipment>> | null = null

  if (orderNumber || email) {
    if (!orderNumber || !email) {
      errorMessage = 'Enter both your order number and the email used at checkout.'
    } else {
      order = await prisma.order.findFirst({
        where: {
          orderNumber,
          customerEmail: {
            equals: email,
            mode: 'insensitive',
          },
        },
        select: {
          orderNumber: true,
          customerName: true,
          status: true,
          trackingNumber: true,
          address: true,
          city: true,
          postalCode: true,
          country: true,
        },
      })

      if (!order) {
        errorMessage = 'We could not find an order matching that order number and email address.'
      } else if (!order.trackingNumber) {
        errorMessage = 'Your order has been placed, but a FedEx tracking number has not been created yet.'
      } else {
        try {
          snapshot = await trackFedExShipment(order.trackingNumber)
        } catch (error) {
          errorMessage =
            error instanceof Error
              ? error.message
              : 'We could not fetch live FedEx tracking details right now.'
        }
      }
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <section className="rounded-3xl border bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Foocaps</p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">Track Your Order</h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
          Enter your order number and the email address you used at checkout to view the latest FedEx shipment updates.
        </p>

        <form method="get" className="mt-6 grid gap-4 rounded-2xl border bg-muted/20 p-4 sm:grid-cols-2 sm:p-5">
          <div className="space-y-2">
            <label htmlFor="order" className="text-sm font-medium">
              Order Number
            </label>
            <input
              id="order"
              name="order"
              defaultValue={orderNumber}
              placeholder="ORD-20260516-ERWN0S"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={email}
              placeholder="you@example.com"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="inline-flex rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Track Order
            </button>
          </div>
        </form>
      </section>

      {errorMessage && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {errorMessage}
        </section>
      )}

      {order && (
        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Order Snapshot</p>
            <div className="mt-4 space-y-4 text-sm">
              <div>
                <p className="text-muted-foreground">Order Number</p>
                <p className="font-medium">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{order.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Store Status</p>
                <p className="font-medium">{order.status}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Shipping Address</p>
                <p className="font-medium">
                  {order.address}
                  <br />
                  {order.city}, {order.postalCode}
                  <br />
                  {order.country}
                </p>
              </div>
              {order.trackingNumber && (
                <div>
                  <p className="text-muted-foreground">FedEx Tracking Number</p>
                  <p className="font-mono text-sm">{order.trackingNumber}</p>
                </div>
              )}
            </div>
          </div>

          {snapshot && <TrackingSummary snapshot={snapshot} title="Live FedEx Tracking" />}
        </section>
      )}
    </div>
  )
}
