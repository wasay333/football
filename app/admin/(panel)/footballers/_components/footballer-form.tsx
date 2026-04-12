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
import { FileVideoInput } from '@/app/admin/_components/file-video-input'
import type { Footballer } from '@prisma/client'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function FormSection({ title, children, description }: { title: string; description?: string; children: React.ReactNode }) {
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
      {pending ? 'Saving…' : isEdit ? 'Update Footballer' : 'Save Footballer'}
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

      {/* ── Profile ── */}
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
          <Textarea id="bio" name="bio" rows={3} placeholder="Short biography…" defaultValue={footballer?.bio ?? ''} />
        </div>

        <div className="space-y-1.5">
          <Label>
            Profile photo
            <span className="ml-1 text-xs font-normal text-muted-foreground">— used in admin lists (optional)</span>
          </Label>
          <FileImageInput name="profileImage" existingUrl={footballer?.profileImage} />
        </div>
      </FormSection>

      {/* ── Product Page Photos ── */}
      <FormSection
        title="Product Page Photos (optional)"
        description={isEdit ? 'Current photos shown below. Pick a new file to replace one.' : 'These 3 photos appear on the product page alongside the cap.'}
      >
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Photo 1</Label>
            <FileImageInput name="image1" existingUrl={footballer?.image1} />
          </div>
          <div className="space-y-1.5">
            <Label>Photo 2</Label>
            <FileImageInput name="image2" existingUrl={footballer?.image2} />
          </div>
          <div className="space-y-1.5">
            <Label>Photo 3</Label>
            <FileImageInput name="image3" existingUrl={footballer?.image3} />
          </div>
        </div>
      </FormSection>

      {/* ── Video ── */}
      <FormSection
        title="Featured Video (optional)"
        description={isEdit ? 'Current video shown below. Pick a new file to replace it.' : 'One video shown on the product page.'}
      >
        <div className="space-y-1.5">
          <Label>Video file</Label>
          <FileVideoInput name="videoUrl" existingUrl={footballer?.videoUrl} />
        </div>
        <div className="space-y-1.5">
          <Label>
            Video thumbnail
            <span className="ml-1 text-xs font-normal text-muted-foreground">— preview frame before the video plays (optional)</span>
          </Label>
          <FileImageInput name="videoThumbnail" existingUrl={footballer?.videoThumbnail} />
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
