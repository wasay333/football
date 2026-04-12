'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { updateOrderStatusAction, type UpdateStatusState } from '../actions'
import type { OrderStatus } from '@prisma/client'

const ALL_STATUSES: OrderStatus[] = [
  'PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED',
]

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? 'Saving…' : 'Update Status'}
    </button>
  )
}

export function UpdateStatusForm({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const action = updateOrderStatusAction.bind(null, orderId)
  const [state, formAction] = useActionState<UpdateStatusState, FormData>(action, null)

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">New status</label>
        <select
          name="status"
          defaultValue={currentStatus}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Note (optional)</label>
        <input
          type="text"
          name="note"
          placeholder="e.g. Shipped via UPS — tracking: 1Z999AA1"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <SubmitButton />
    </form>
  )
}
