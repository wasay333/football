'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { createDiscountAction, updateDiscountAction, type DiscountFormState } from '../actions'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

type DiscountRule = {
  id: string
  name: string
  itemCount: number
  fixedTotal: number
  isActive: boolean
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="mt-1 text-xs text-destructive">{message}</p>
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving…' : isEdit ? 'Update Rule' : 'Save Rule'}
    </Button>
  )
}

export function DiscountForm({ rule }: { rule?: DiscountRule | null }) {
  const isEdit = !!rule
  const action = isEdit ? updateDiscountAction.bind(null, rule.id) : createDiscountAction
  const [state, formAction] = useActionState<DiscountFormState, FormData>(action, null)

  return (
    <form action={formAction} className="space-y-5">
      {state?.errors?.form && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.errors.form[0]}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="name">Rule Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="2 Caps for $80"
          defaultValue={rule?.name ?? ''}
        />
        <FieldError message={state?.errors?.name?.[0]} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="itemCount">Exact Item Count</Label>
          <Input
            id="itemCount"
            name="itemCount"
            type="number"
            min={1}
            max={25}
            defaultValue={rule?.itemCount ?? 2}
          />
          <p className="text-xs text-muted-foreground">Apply this rule only when the cart has exactly this many items.</p>
          <FieldError message={state?.errors?.itemCount?.[0]} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="fixedTotal">Fixed Checkout Total ($)</Label>
          <Input
            id="fixedTotal"
            name="fixedTotal"
            type="number"
            step="0.01"
            min={0.01}
            defaultValue={rule ? rule.fixedTotal.toFixed(2) : '80.00'}
          />
          <p className="text-xs text-muted-foreground">Customers will pay this total instead of the regular subtotal when the rule saves money.</p>
          <FieldError message={state?.errors?.fixedTotal?.[0]} />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-lg border p-3 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={rule?.isActive ?? true}
          className="mt-0.5 h-4 w-4"
        />
        <span>
          <span className="block font-medium">Active</span>
          <span className="block text-muted-foreground">Inactive rules stay saved in admin but won’t apply at checkout.</span>
        </span>
      </label>

      <div className="flex justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" asChild>
          <Link href="/admin/discounts">Cancel</Link>
        </Button>
        <SubmitButton isEdit={isEdit} />
      </div>
    </form>
  )
}
