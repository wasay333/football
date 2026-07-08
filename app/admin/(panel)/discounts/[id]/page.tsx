import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { prisma } from '@/prisma'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { DiscountForm } from '../_components/discount-form'

export const metadata = { title: 'Edit Discount Rule' }

export default async function EditDiscountPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const rule = await prisma.checkoutDiscountRule.findUnique({ where: { id } })
  if (!rule) notFound()

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/discounts">
            <ChevronLeft className="size-4" />
            Discounts
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="font-semibold">Edit Discount Rule</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>{rule.name}</CardTitle>
            <CardDescription>Update the item-count rule and fixed checkout total below.</CardDescription>
          </CardHeader>
          <CardContent>
            <DiscountForm
              rule={{
                id: rule.id,
                name: rule.name,
                itemCount: rule.itemCount,
                fixedTotal: Number(rule.fixedTotal),
                isActive: rule.isActive,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
