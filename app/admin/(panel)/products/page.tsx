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
import { PaginationControls } from '@/components/pagination-controls'

export const metadata = { title: 'Products' }

const PRODUCTS_PER_PAGE = 50

function normalizePage(value?: string) {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1
}

const statusVariant: Record<ProductStatus, 'default' | 'secondary' | 'outline'> = {
  ACTIVE: 'default',
  DRAFT: 'secondary',
  ARCHIVED: 'outline',
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const params = await searchParams
  const requestedPage = normalizePage(params.page)
  const totalProducts = await prisma.product.count()
  const totalPages = Math.max(1, Math.ceil(totalProducts / PRODUCTS_PER_PAGE))
  const currentPage = Math.min(requestedPage, totalPages)

  const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    skip: (currentPage - 1) * PRODUCTS_PER_PAGE,
    take: PRODUCTS_PER_PAGE,
    include: {
      footballer: { select: { name: true } },
      category: { select: { name: true } },
    },
  })

  return (
    <>
      <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="flex-1 font-semibold">Products</h1>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/admin/products/new">
            <Plus className="size-4" />
            Add Product
          </Link>
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <PaginationControls basePath="/admin/products" currentPage={currentPage} totalPages={totalPages} />
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-muted-foreground">No products yet.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/admin/products/new">Add your first product</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:hidden">
              {products.map((p) => (
                <Card key={p.id}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-md bg-muted">
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
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{p.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.slug}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                          {p.stock === 0 && p.allowPreorder && <Badge variant="outline">Pre-order</Badge>}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Footballer</p>
                        <p className="mt-1">{p.footballer.name}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Category</p>
                        <p className="mt-1">{p.category?.name ?? '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Price</p>
                        <p className="mt-1">${Number(p.price).toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Stock</p>
                        <div className="mt-1">
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
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/admin/products/${p.id}`}>Edit</Link>
                      </Button>
                      <DeleteProductButton id={p.id} name={p.name} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="hidden md:block">
              <CardContent className="p-0 overflow-x-auto">
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
          </>
        )}
      </div>
    </>
  )
}
