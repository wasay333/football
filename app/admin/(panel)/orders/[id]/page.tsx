import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { prisma } from '@/prisma'
import { Badge } from '@/components/ui/badge'

export const dynamic = "force-dynamic";
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import type { OrderStatus } from '@prisma/client'
import { UpdateStatusForm } from './_components/update-status-form'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const order = await prisma.order.findUnique({ where: { id }, select: { orderNumber: true } })
  return { title: order ? `Order ${order.orderNumber}` : 'Order' }
}

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  PROCESSING: 'default',
  SHIPPED: 'default',
  DELIVERED: 'outline',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { name: true } } } },
      statusHistory: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!order) notFound()

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
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">Size</th>
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
                    <td className="px-4 py-3 text-muted-foreground">{item.size ?? '—'}</td>
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
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span>{Number(order.shippingCost) === 0 ? 'Free' : `$${Number(order.shippingCost).toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between font-semibold pt-1 border-t">
                <span>Total</span><span>${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Update status */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Update Status</CardTitle></CardHeader>
            <CardContent>
              <UpdateStatusForm orderId={order.id} currentStatus={order.status} />
            </CardContent>
          </Card>

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
