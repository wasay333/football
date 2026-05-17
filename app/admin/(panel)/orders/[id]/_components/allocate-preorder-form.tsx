'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  allocatePreorderInventoryAction,
  type AllocatePreorderState,
} from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? 'Allocating...' : 'Allocate Inventory'}
    </button>
  )
}

export function AllocatePreorderForm({ orderId }: { orderId: string }) {
  const action = allocatePreorderInventoryAction.bind(null, orderId)
  const [state, formAction] = useActionState<AllocatePreorderState, FormData>(action, null)

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      <p className="text-sm text-muted-foreground">
        Use this after you restock the product. Allocation will reserve stock for this order and move it to READY_TO_SHIP.
      </p>
      <SubmitButton />
    </form>
  )
}
