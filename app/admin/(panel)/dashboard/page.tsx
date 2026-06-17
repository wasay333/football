import Link from 'next/link'
import { Package, ShoppingCart, DollarSign, Users, BarChart3, ExternalLink } from 'lucide-react'

export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { prisma } from '@/prisma'

export const metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const [productCount, footballerCount, orderCount, revenueResult] = await Promise.all([
    prisma.product.count(),
    prisma.footballer.count(),
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
  ])

  const revenue = Number(revenueResult._sum.total ?? 0)
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ''

  const stats = [
    {
      title: 'Total Products',
      value: productCount.toString(),
      description: `${footballerCount} footballer${footballerCount !== 1 ? 's' : ''} in the store`,
      icon: Package,
    },
    {
      title: 'Total Orders',
      value: orderCount.toString(),
      description: 'All time orders placed',
      icon: ShoppingCart,
    },
    {
      title: 'Revenue',
      value: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Total from all orders',
      icon: DollarSign,
    },
    {
      title: 'Footballers',
      value: footballerCount.toString(),
      description: 'Featured in the store',
      icon: Users,
    },
  ]

  return (
    <>
      <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-semibold">Dashboard</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-4" />
                Google Analytics
              </CardTitle>
              <CardDescription>
                Track visitors, sessions, top pages, and traffic sources from the public store.
              </CardDescription>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link href="https://analytics.google.com/" target="_blank" rel="noreferrer">
                Open Analytics
                <ExternalLink className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border bg-muted/30 p-4">
              <p className="text-sm font-medium">
                Status: {gaMeasurementId ? 'Connected' : 'Setup needed'}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {gaMeasurementId
                  ? `Measurement ID: ${gaMeasurementId}`
                  : 'Add NEXT_PUBLIC_GA_MEASUREMENT_ID to your environment to start collecting visitor data.'}
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Visitor numbers will appear in Google Analytics, not in VPS bandwidth charts. Admin page visits are excluded from storefront tracking.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
