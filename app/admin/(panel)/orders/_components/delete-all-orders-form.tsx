'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { deleteAllOrdersAction, type DeleteAllOrdersState } from '../actions'

const CONFIRMATION_TEXT = 'DELETE ALL ORDERS'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" variant="destructive" disabled={pending} className="w-full sm:w-auto">
      {pending ? 'Deleting...' : 'Delete All Orders'}
    </Button>
  )
}

export function DeleteAllOrdersForm() {
  const [state, formAction] = useActionState<DeleteAllOrdersState, FormData>(deleteAllOrdersAction, null)

  return (
    <form action={formAction} className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Deletes all order records and their status history. Product stock is not restored automatically.
      </p>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}

      <div className="space-y-2">
        <label htmlFor="delete-all-orders-confirmation" className="text-xs font-medium text-muted-foreground">
          Type {CONFIRMATION_TEXT}
        </label>
        <Input
          id="delete-all-orders-confirmation"
          name="confirmation"
          placeholder={CONFIRMATION_TEXT}
          autoComplete="off"
        />
      </div>

      <SubmitButton />
    </form>
  )
}
