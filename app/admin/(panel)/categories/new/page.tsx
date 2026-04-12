import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { CategoryForm } from '../_components/category-form'

export const metadata = { title: 'New Category' }

export default function NewCategoryPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/admin/categories">
            <ChevronLeft className="size-4" />
            Categories
          </Link>
        </Button>
        <Separator orientation="vertical" className="h-4" />
        <h1 className="font-semibold">New Category</h1>
      </header>

      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Create Category</CardTitle>
            <CardDescription>Add a category to group your cap products.</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoryForm />
          </CardContent>
        </Card>
      </div>
    </>
  )
}
