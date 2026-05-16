import Link from 'next/link'
import { prisma } from '@/prisma'
import { Badge } from '@/components/ui/badge'

export const dynamic = "force-dynamic";
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import type { OrderStatus } from '@prisma/client'

export const metadata = { title: 'Orders' }

const statusVariant: Record<OrderStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  CONFIRMED: 'default',
  PROCESSING: 'default',
  SHIPPED: 'default',
  DELIVERED: 'outline',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
}

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      items: { select: { quantity: true } },
    },
  })

  return (
    <>
      <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-semibold">Orders</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:hidden">
              {orders.map((order) => {
                const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0)
                return (
                  <Card key={order.id}>
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm hover:underline">
                            {order.orderNumber}
                          </Link>
                          <p className="mt-1 font-medium">{order.customerName}</p>
                          <p className="text-xs text-muted-foreground">{order.customerEmail}</p>
                        </div>
                        <Badge variant={statusVariant[order.status]}>{order.status}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Items</p>
                          <p className="mt-1">{itemCount}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
                          <p className="mt-1">${Number(order.total).toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Type</p>
                          <div className="mt-1">
                            {order.isPreorder ? <Badge variant="outline">Pre-order</Badge> : <span>Standard</span>}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs uppercase tracking-wide text-muted-foreground">Date</p>
                          <p className="mt-1 text-muted-foreground">
                            {new Date(order.createdAt).toLocaleDateString('en-US', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <Card className="hidden md:block">
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order #</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => {
                    const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0)
                    return (
                      <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">

                        <TableCell className="font-mono text-sm">
                          <Link href={`/admin/orders/${order.id}`} className="hover:underline">
                            {order.orderNumber}
                          </Link>
                        </TableCell>

                        <TableCell>
                          <div className="font-medium">{order.customerName}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.customerEmail}
                          </div>
                        </TableCell>

                        <TableCell className="text-sm">{itemCount}</TableCell>

                        <TableCell className="text-sm">
                          ${Number(order.total).toFixed(2)}
                        </TableCell>

                        <TableCell>
                          <Badge variant={statusVariant[order.status]}>
                            {order.status}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          {order.isPreorder && (
                            <Badge variant="outline">Pre-order</Badge>
                          )}
                        </TableCell>

                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(order.createdAt).toLocaleDateString('en-US', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  )
}
