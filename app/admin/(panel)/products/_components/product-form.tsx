'use client'

import { useState } from 'react'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createProductAction, updateProductAction, type ProductFormState } from '../actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FileImageInput } from '@/app/admin/_components/file-image-input'
import Link from 'next/link'
import type { Product } from '@prisma/client'

type Footballer = { id: string; name: string; club: string | null }
type Category = { id: string; name: string }

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

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {title}
      </h3>
      {children}
    </div>
  )
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : isEdit ? 'Update Product' : 'Save Product'}
    </Button>
  )
}

export function ProductForm({
  footballers,
  categories,
  product,
}: {
  footballers: Footballer[]
  categories: Category[]
  product?: Product | null
}) {
  const isEdit = !!product

  const action = isEdit
    ? updateProductAction.bind(null, product.id)
    : createProductAction

  const [state, formAction] = useActionState<ProductFormState, FormData>(action, null)

  const [slug, setSlug] = useState(product?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(isEdit)

  return (
    <form action={formAction} className="space-y-8">
      {state?.errors?.form && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.errors.form[0]}
        </div>
      )}

      {/* ── Basic Info ── */}
      <FormSection title="Basic Info">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Messi Signature Cap"
            defaultValue={product?.name ?? ''}
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value))
            }}
          />
          <FieldError message={state?.errors?.name?.[0]} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="slug">
            Slug
            <span className="ml-1 text-xs font-normal text-muted-foreground">
              — used in the URL, auto-generated from name
            </span>
          </Label>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugTouched(true)
            }}
            placeholder="messi-signature-cap"
          />
          <FieldError message={state?.errors?.slug?.[0]} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={4}
            placeholder="Describe the cap…"
            defaultValue={product?.description ?? ''}
          />
          <FieldError message={state?.errors?.description?.[0]} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              name="status"
              defaultValue={product?.status ?? 'DRAFT'}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoryId">Category (optional)</Label>
            <select
              id="categoryId"
              name="categoryId"
              defaultValue={product?.categoryId ?? ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </FormSection>

      {/* ── Pricing & Stock ── */}
      <FormSection title="Pricing & Stock">
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              step="0.01"
              min="0"
              placeholder="29.99"
              defaultValue={product ? String(product.price) : ''}
            />
            <FieldError message={state?.errors?.price?.[0]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stock">Stock</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              min="0"
              defaultValue={product?.stock ?? 0}
            />
            <FieldError message={state?.errors?.stock?.[0]} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lowStockThreshold">Low stock alert at</Label>
            <Input
              id="lowStockThreshold"
              name="lowStockThreshold"
              type="number"
              min="0"
              defaultValue={product?.lowStockThreshold ?? 5}
            />
            <FieldError message={state?.errors?.lowStockThreshold?.[0]} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="allowPreorder"
            id="allowPreorder"
            className="h-4 w-4 rounded border-input"
            defaultChecked={product?.allowPreorder ?? false}
          />
          <Label htmlFor="allowPreorder" className="font-normal">
            Allow pre-orders when out of stock
          </Label>
        </div>

        <div className="space-y-1.5">
          <Label>Size</Label>
          <Input value="One size" disabled readOnly />
          <p className="text-xs text-muted-foreground">
            All products use a single size across the storefront and checkout.
          </p>
        </div>
      </FormSection>

      {/* ── Footballer ── */}
      <FormSection title="Footballer">
        {footballers.length === 0 ? (
          <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            No footballers yet.{' '}
            <Link href="/admin/footballers/new" className="font-medium underline">
              Create a footballer first
            </Link>
            , then come back to add a product.
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label htmlFor="footballerId">Select footballer</Label>
            <select
              id="footballerId"
              name="footballerId"
              defaultValue={product?.footballerId ?? ''}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Choose a footballer…</option>
              {footballers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                  {f.club ? ` — ${f.club}` : ''}
                </option>
              ))}
            </select>
            <FieldError message={state?.errors?.footballerId?.[0]} />
            <p className="text-xs text-muted-foreground">
              Not listed?{' '}
              <Link href="/admin/footballers/new" className="underline">
                Create a new footballer
              </Link>
            </p>
          </div>
        )}
      </FormSection>

      {/* ── Mannequin Image ── */}
      <FormSection title="Mannequin Image">
        <p className="text-xs text-muted-foreground">
          Shown on the home page and product listing. Use a mannequin or model shot.
        </p>
        <div className="max-w-[160px]">
          <FileImageInput
            name="mannequinImage"
            existingUrl={(product as unknown as { mannequinImage?: string | null })?.mannequinImage}
            error={state?.errors?.mannequinImage?.[0]}
          />
        </div>
      </FormSection>

      {/* ── Cap Images ── */}
      <FormSection title="Product Detail Images (optional)">
        <p className="text-xs text-muted-foreground">
          Shown only on the product page gallery. Use close-up cap shots.
          {isEdit ? ' Pick a new file to replace one.' : ''}
        </p>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Image 1</Label>
            <FileImageInput
              name="capImage1"
              existingUrl={product?.capImage1}
              error={state?.errors?.capImage1?.[0]}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Image 2</Label>
            <FileImageInput
              name="capImage2"
              existingUrl={product?.capImage2}
              error={state?.errors?.capImage2?.[0]}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Image 3</Label>
            <FileImageInput
              name="capImage3"
              existingUrl={product?.capImage3}
              error={state?.errors?.capImage3?.[0]}
            />
          </div>
        </div>
      </FormSection>

      <div className="flex justify-end gap-3 border-t pt-6">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/products">Cancel</Link>
        </Button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
