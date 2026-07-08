'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteDiscountAction } from '../actions'

export function DeleteDiscountButton({ id, name }: { id: string; name: string }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm(`Delete "${name}"? This rule will stop applying at checkout.`)) return
    startTransition(async () => {
      const result = await deleteDiscountAction(id)
      if (result?.error) alert(result.error)
    })
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-destructive hover:text-destructive"
      disabled={isPending}
      onClick={handleDelete}
    >
      <Trash2 className="size-4" />
      {isPending ? 'Deleting…' : 'Delete'}
    </Button>
  )
}
