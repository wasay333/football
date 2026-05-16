'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  createFedExShipmentAction,
  type CreateFedExShipmentState,
} from '../actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
    >
      {pending ? 'Creating Label...' : 'Create FedEx Shipment'}
    </button>
  )
}

export function CreateFedExShipmentForm({ orderId }: { orderId: string }) {
  const action = createFedExShipmentAction.bind(null, orderId)
  const [state, formAction] = useActionState<CreateFedExShipmentState, FormData>(action, null)

  return (
    <form action={formAction} className="space-y-3">
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      {state?.success && <p className="text-sm text-green-700">{state.success}</p>}
      {state?.labelPath && (
        <div className="flex flex-wrap gap-2">
          <a
            href={state.labelPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Download Label
          </a>
          <a
            href={state.labelPath}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            Print Label
          </a>
        </div>
      )}
      <p className="text-sm text-muted-foreground">
        This creates the shipment label and tracking number using FedEx without scheduling a pickup.
        If `FEDEX_DEFAULT_SERVICE_TYPE` is set, no rate lookup is needed first.
      </p>
      <SubmitButton />
    </form>
  )
}
