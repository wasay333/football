'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createCategoryAction, updateCategoryAction, type CategoryFormState } from '../actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type Category = { id: string; name: string; slug: string }

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : isEdit ? 'Update Category' : 'Save Category'}
    </Button>
  )
}

export function CategoryForm({ category }: { category?: Category | null }) {
  const isEdit = !!category
  const action = isEdit
    ? updateCategoryAction.bind(null, category.id)
    : createCategoryAction

  const [state, formAction] = useActionState<CategoryFormState, FormData>(action, null)
  const [slug, setSlug] = useState(category?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(isEdit)

  return (
    <form action={formAction} className="space-y-5">
      {state?.errors?.form && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.errors.form[0]}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="Snapback"
          defaultValue={category?.name ?? ''}
          onChange={(e) => { if (!slugTouched) setSlug(slugify(e.target.value)) }}
        />
        <FieldError message={state?.errors?.name?.[0]} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="slug">
          Slug
          <span className="ml-1 text-xs font-normal text-muted-foreground">— auto-generated from name</span>
        </Label>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }}
          placeholder="snapback"
        />
        <FieldError message={state?.errors?.slug?.[0]} />
      </div>

      <div className="flex justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/categories">Cancel</Link>
        </Button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
