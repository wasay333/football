import Link from 'next/link'
import { Plus } from 'lucide-react'
import { prisma } from '@/prisma'
import { Button } from '@/components/ui/button'
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
import { DeleteFootballerButton } from './_components/delete-footballer-button'

export const metadata = { title: 'Footballers' }

export default async function FootballersPage() {
  const footballers = await prisma.footballer.findMany({
    orderBy: { name: 'asc' },
    include: { _count: { select: { products: true } } },
  })

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <h1 className="flex-1 font-semibold">Footballers</h1>
        <Button asChild size="sm">
          <Link href="/admin/footballers/new">
            <Plus className="size-4" />
            Add Footballer
          </Link>
        </Button>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        {footballers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-muted-foreground">No footballers yet.</p>
            <Button asChild size="sm" className="mt-4">
              <Link href="/admin/footballers/new">Add your first footballer</Link>
            </Button>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Photo</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Nationality</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="w-40" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {footballers.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>
                        <div className="h-10 w-10 overflow-hidden rounded-full bg-muted">
                          {f.profileImage && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={f.profileImage}
                              alt={f.name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="text-sm">{f.position ?? '—'}</TableCell>
                      <TableCell className="text-sm">{f.club ?? '—'}</TableCell>
                      <TableCell className="text-sm">{f.nationality ?? '—'}</TableCell>
                      <TableCell className="text-sm">{f._count.products}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/footballers/${f.id}`}>Edit</Link>
                          </Button>
                          <DeleteFootballerButton id={f.id} name={f.name} productCount={f._count.products} />
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
