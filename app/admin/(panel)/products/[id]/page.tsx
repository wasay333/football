import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { prisma } from '@/prisma'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { ProductForm } from '../_components/product-form'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return {
    title: id === 'new' ? 'New Product' : 'Edit Product',
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const isNew = id === 'new'

  const product = isNew
    ? null
    : await prisma.product.findUnique({ where: { id } })

  if (!isNew && !product) notFound()

  const [footballers, categories] = await Promise.all([
    prisma.footballer.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true, club: true },
    }),
    prisma.category.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/products">
            <ChevronLeft className="size-4" />
            Products
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="font-semibold">{isNew ? 'New Product' : 'Edit Product'}</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>{isNew ? 'Create Product' : 'Edit Product'}</CardTitle>
            <CardDescription>
              {isNew
                ? 'Fill in the details to add a new cap to your store.'
                : 'Update the product details below.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm footballers={footballers} categories={categories} product={product} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
