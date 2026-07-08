import { prisma } from '@/prisma'

export type PricingTotals = {
  subtotal: number
  discount: number
  shipping: number
  total: number
  discountLabel: string | null
}

export type PricingLineItem = {
  price: number
  quantity: number
}

export async function calculateCheckoutTotals(
  lines: PricingLineItem[],
  shipping = 0,
): Promise<PricingTotals> {
  const subtotal = roundCurrency(lines.reduce((sum, line) => sum + line.price * line.quantity, 0))
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0)

  const rule = itemCount
    ? await prisma.checkoutDiscountRule.findFirst({
        where: { itemCount, isActive: true },
        select: { name: true, fixedTotal: true },
      })
    : null

  const fixedTotal = rule ? Number(rule.fixedTotal) : null
  const discount = fixedTotal !== null && fixedTotal !== subtotal
    ? roundCurrency(subtotal - fixedTotal)
    : 0

  const total = roundCurrency(subtotal - discount + shipping)

  return {
    subtotal,
    discount,
    shipping: roundCurrency(shipping),
    total,
    discountLabel: discount > 0 && rule ? rule.name : null,
  }
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}
