import { prisma } from '@/prisma'
import type { DiscountRuleSummary } from '@/lib/discount-display'

export async function getActiveDiscountRules(): Promise<DiscountRuleSummary[]> {
  const rules = await prisma.checkoutDiscountRule.findMany({
    where: { isActive: true },
    orderBy: { itemCount: 'asc' },
    select: {
      name: true,
      itemCount: true,
      fixedTotal: true,
    },
  })

  return rules.map((rule) => ({
    name: rule.name,
    itemCount: rule.itemCount,
    fixedTotal: Number(rule.fixedTotal),
  }))
}
