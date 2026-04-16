import Link from 'next/link'
import { Plus, AlertTriangle } from 'lucide-react'
import { prisma } from '@/prisma'

export const dynamic = "force-dynamic";
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import type { ProductStatus } from '@prisma/client'
import { DeleteProductButton } from './_components/delete-product-button'

export const metadata = { title: 'Products' }

const statusVariant: Record<ProductStatus, 'default' | 'secondary' | 'outline'> = {
  ACTIVE: 'default',
  DRAFT: 'secondary',
  ARCHIVED: 'outline',
}

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      footballer: { select: { name: true } },
      category: { select: { name: true } },
    },
  })

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="flex-1 font-semibold">Products</h1>
        <Button asChild size="sm">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Add Product
          </Link>
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-muted-foreground">No products yet.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/admin/products/new">Add your first product</Link>
            </Button>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Footballer</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="h-10 w-10 overflow-hidden rounded-md bg-muted">
                          {p.capImage1 ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={p.capImage1}
                              alt={p.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="h-full w-full" />
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="font-medium">{p.name}</div>
                        <div className="text-xs text-muted-foreground">{p.slug}</div>
                      </TableCell>

                      <TableCell className="text-sm">{p.footballer.name}</TableCell>

                      <TableCell className="text-sm">{p.category?.name ?? '—'}</TableCell>

                      <TableCell className="text-sm">${Number(p.price).toFixed(2)}</TableCell>

                      <TableCell>
                        {p.stock === 0 ? (
                          <span className="text-sm font-medium text-destructive">
                            {p.allowPreorder ? 'Pre-order' : 'Out of stock'}
                          </span>
                        ) : (
                          <div className="flex items-center gap-1 text-sm">
                            {p.stock <= p.lowStockThreshold && (
                              <AlertTriangle className="size-3 text-amber-500" />
                            )}
                            {p.stock}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/products/${p.id}`}>Edit</Link>
                          </Button>
                          <DeleteProductButton id={p.id} name={p.name} />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
