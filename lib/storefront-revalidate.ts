import 'server-only'

import { revalidatePath } from 'next/cache'

export function revalidateStorefront(productIds: Iterable<string> = []) {
  revalidatePath('/')
  revalidatePath('/product')
  revalidatePath('/collections')

  for (const productId of productIds) {
    const normalized = productId.trim()
    if (normalized) {
      revalidatePath(`/product/${normalized}`)
    }
  }
}
