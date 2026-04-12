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
import { FootballerForm } from '../_components/footballer-form'

export const metadata = { title: 'Edit Footballer' }

export default async function EditFootballerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const footballer = await prisma.footballer.findUnique({ where: { id } })
  if (!footballer) notFound()

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/footballers">
            <ChevronLeft className="size-4" />
            Footballers
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="font-semibold">Edit Footballer</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>{footballer.name}</CardTitle>
            <CardDescription>Update the footballer details below.</CardDescription>
          </CardHeader>
          <CardContent>
            <FootballerForm footballer={footballer} />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
