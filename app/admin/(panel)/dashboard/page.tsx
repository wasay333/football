import { Package, ShoppingCart, DollarSign, Users } from 'lucide-react'

export const dynamic = "force-dynamic";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="font-semibold">Dashboard</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
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
      </div>
    </>
  )
}
