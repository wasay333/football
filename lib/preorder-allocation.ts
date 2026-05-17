import { Prisma } from '@prisma/client'

function summarizeAllocatedItems(itemNames: string[]) {
  if (itemNames.length === 1) {
    return itemNames[0]
  }

  return `${itemNames.length} pre-order items`
}

export async function allocateWaitingPreordersForProduct(
  tx: Prisma.TransactionClient,
  replenishedProductId: string,
) {
  const candidateOrders = await tx.order.findMany({
    where: {
      isPreorder: true,
      status: 'AWAITING_STOCK',
      items: {
        some: {
          productId: replenishedProductId,
          isPreorder: true,
        },
      },
    },
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
    orderBy: {
      createdAt: 'asc',
    },
  })

  for (const order of candidateOrders) {
    const preorderItems = order.items.filter((item) => item.isPreorder)
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

    // Skip blocked orders and keep checking later waiting pre-orders.
    // This lets fully coverable orders move to READY_TO_SHIP even if an
    // earlier order still depends on some other out-of-stock pre-order item.
    if (!canAllocateEntireOrder) {
      continue
    }

    for (const [productId, requirement] of requiredByProduct.entries()) {
      await tx.product.update({
        where: { id: productId },
        data: {
          stock: {
            decrement: requirement.quantity,
          },
        },
      })
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
        note: `Inventory allocated for ${summarizeAllocatedItems(allocatedNames)}. This pre-order is now ready for FedEx shipment creation.`,
      },
    })
  }
}
