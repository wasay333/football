import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/prisma'

export const dynamic = "force-dynamic";
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { DeleteCategoryButton } from './_components/delete-category-button'

export const metadata = { title: 'Categories' }

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })

  return (
    <>
      <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="flex-1 font-semibold">Categories</h1>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/admin/categories/new">
            <Plus className="size-4" />
            Add Category
          </Link>
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        {categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-muted-foreground">No categories yet.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/admin/categories/new">Add your first category</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:hidden">
              {categories.map((c) => (
                <Card key={c.id}>
                  <CardContent className="space-y-4 p-4">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="mt-1 break-all font-mono text-xs text-muted-foreground">{c.slug}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-muted-foreground">Products</p>
                        <p className="mt-1">{c._count.products}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/admin/categories/${c.id}`}>Edit</Link>
                      </Button>
                      <DeleteCategoryButton id={c.id} name={c.name} />
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
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="w-32" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{c.slug}</TableCell>
                      <TableCell className="text-sm">{c._count.products}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/categories/${c.id}`}>Edit</Link>
                          </Button>
                          <DeleteCategoryButton id={c.id} name={c.name} />
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
