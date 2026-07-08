import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/prisma'

export const dynamic = 'force-dynamic'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { DeleteDiscountButton } from './_components/delete-discount-button'

export const metadata = { title: 'Discounts' }

export default async function DiscountsPage() {
  const rules = await prisma.checkoutDiscountRule.findMany({
    orderBy: [{ itemCount: 'asc' }, { createdAt: 'desc' }],
  })

  return (
    <>
      <header className="flex min-h-16 shrink-0 flex-wrap items-center gap-2 border-b px-4 py-3">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="flex-1 font-semibold">Discounts</h1>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link href="/admin/discounts/new">
            <Plus className="size-4" />
            Add Rule
          </Link>
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
        <Card className="border-dashed">
          <CardContent className="space-y-2 p-4 sm:p-5 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How it works</p>
            <p>Set an exact item count and a fixed checkout total. Example: 2 items for $80.</p>
            <p>The rule only applies when it lowers the customer’s subtotal.</p>
          </CardContent>
        </Card>

        {rules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-muted-foreground">No discount rules yet.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/admin/discounts/new">Create your first rule</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 md:hidden">
              {rules.map((rule) => (
                <Card key={rule.id}>
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{rule.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {rule.itemCount} item{rule.itemCount === 1 ? '' : 's'} for ${Number(rule.fixedTotal).toFixed(2)}
                        </p>
                      </div>
                      <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/admin/discounts/${rule.id}`}>Edit</Link>
                      </Button>
                      <DeleteDiscountButton id={rule.id} name={rule.name} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="hidden md:block">
              <CardContent className="overflow-x-auto p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Item Count</TableHead>
                      <TableHead>Fixed Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-32" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-medium">{rule.name}</TableCell>
                        <TableCell>{rule.itemCount}</TableCell>
                        <TableCell>${Number(rule.fixedTotal).toFixed(2)}</TableCell>
                        <TableCell>
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/admin/discounts/${rule.id}`}>Edit</Link>
                            </Button>
                            <DeleteDiscountButton id={rule.id} name={rule.name} />
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
