'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { deleteFootballerAction } from '../actions'

export function DeleteFootballerButton({ id, name, productCount }: { id: string; name: string; productCount: number }) {
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (productCount > 0) {
      alert(`Cannot delete "${name}" — they have ${productCount} product(s). Delete or reassign the products first.`)
      return
    }
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    startTransition(async () => {
      const result = await deleteFootballerAction(id)
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
