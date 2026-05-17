import { Prisma } from '@prisma/client'

export class PreorderAllocationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PreorderAllocationError'
  }
}

function summarizeAllocatedItems(itemNames: string[]) {
  if (itemNames.length === 1) {
    return itemNames[0]
  }

  return `${itemNames.length} pre-order items`
}

export async function allocatePreorderOrder(
  tx: Prisma.TransactionClient,
  orderId: string,
) {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        select: {
          productId: true,
          productName: true,
          quantity: true,
          isPreorder: true,
        },
      },
    },
  })

  if (!order) {
    throw new PreorderAllocationError('Order not found.')
  }

  if (!order.isPreorder) {
    throw new PreorderAllocationError('Only pre-order orders can be allocated manually.')
  }

  if (order.status === 'READY_TO_SHIP') {
    throw new PreorderAllocationError('This pre-order is already allocated and ready to ship.')
  }

  if (order.status !== 'AWAITING_STOCK') {
    throw new PreorderAllocationError('This pre-order is not waiting for stock allocation.')
  }

  const preorderItems = order.items.filter((item) => item.isPreorder)
  if (!preorderItems.length) {
    throw new PreorderAllocationError('This order has no pre-order items to allocate.')
  }

  const requiredByProduct = new Map<string, { quantity: number; names: string[] }>()

  for (const item of preorderItems) {
    const current = requiredByProduct.get(item.productId)
    if (current) {
      current.quantity += item.quantity
      current.names.push(item.productName)
      continue
    }

    requiredByProduct.set(item.productId, {
      quantity: item.quantity,
      names: [item.productName],
    })
  }

  const stockRows = await tx.product.findMany({
    where: {
      id: {
        in: Array.from(requiredByProduct.keys()),
      },
    },
    select: {
      id: true,
      stock: true,
    },
  })

  const stockByProductId = new Map(stockRows.map((product) => [product.id, product.stock]))
  const canAllocateEntireOrder = Array.from(requiredByProduct.entries()).every(([productId, requirement]) => {
    return (stockByProductId.get(productId) ?? 0) >= requirement.quantity
  })

  if (!canAllocateEntireOrder) {
    throw new PreorderAllocationError('Not enough stock is available to allocate this pre-order yet.')
  }

  for (const [productId, requirement] of requiredByProduct.entries()) {
    const updated = await tx.product.updateMany({
      where: {
        id: productId,
        stock: { gte: requirement.quantity },
      },
      data: {
        stock: {
          decrement: requirement.quantity,
        },
      },
    })

    if (updated.count !== 1) {
      throw new PreorderAllocationError('Stock changed during allocation. Please try again.')
    }
  }

  const allocatedNames = preorderItems.map((item) => item.productName)

  await tx.order.update({
    where: { id: order.id },
    data: { status: 'READY_TO_SHIP' },
  })

  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      status: 'READY_TO_SHIP',
      note: `Inventory allocated manually for ${summarizeAllocatedItems(allocatedNames)}. This pre-order is now ready for FedEx shipment creation.`,
    },
  })
}
