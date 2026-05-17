'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createFootballerAction, updateFootballerAction, type FootballerFormState } from '../actions'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FileImageInput } from '@/app/admin/_components/file-image-input'
import type { Footballer } from '@prisma/client'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function FormSection({
  title,
  children,
  description,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {title}
        </h3>
        {description && <p className="mt-1 text-xs text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : isEdit ? 'Update Footballer' : 'Save Footballer'}
    </Button>
  )
}

export function FootballerForm({ footballer }: { footballer?: Footballer | null }) {
  const isEdit = !!footballer

  const action = isEdit
    ? updateFootballerAction.bind(null, footballer.id)
    : createFootballerAction

  const [state, formAction] = useActionState<FootballerFormState, FormData>(action, null)

  return (
    <form action={formAction} className="space-y-8">
      {state?.errors?.form && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.errors.form[0]}
        </div>
      )}

      <FormSection title="Profile">
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            name="name"
            placeholder="Lionel Messi"
            defaultValue={footballer?.name ?? ''}
          />
          <FieldError message={state?.errors?.name?.[0]} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="position">Position (optional)</Label>
            <Input id="position" name="position" placeholder="Forward" defaultValue={footballer?.position ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="club">Club (optional)</Label>
            <Input id="club" name="club" placeholder="Inter Miami" defaultValue={footballer?.club ?? ''} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nationality">Nationality (optional)</Label>
            <Input id="nationality" name="nationality" placeholder="Argentine" defaultValue={footballer?.nationality ?? ''} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio (optional)</Label>
          <Textarea id="bio" name="bio" rows={3} placeholder="Short biography..." defaultValue={footballer?.bio ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label>
            Profile photo
            <span className="ml-1 text-xs font-normal text-muted-foreground">- used across admin, search, and the product page hero background (optional)</span>
          </Label>
          <FileImageInput name="profileImage" existingUrl={footballer?.profileImage} />
        </div>
      </FormSection>

      <div className="flex justify-end gap-3 border-t pt-6">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/footballers">Cancel</Link>
        </Button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
