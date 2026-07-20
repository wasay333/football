export type DiscountRuleSummary = {
  name: string
  itemCount: number
  fixedTotal: number
}

export type SinglePurchaseDiscount = {
  name: string
  originalPrice: number
  salePrice: number
  saveAmount: number
  savePercent: number
}

export type MultiPurchaseDiscount = {
  name: string
  itemCount: number
  fixedTotal: number
  regularTotal: number
  saveAmount: number
  savePercent: number
}

export function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function getSavePercent(saveAmount: number, regularTotal: number) {
  if (regularTotal <= 0 || saveAmount <= 0) return 0
  return Math.max(1, Math.round((saveAmount / regularTotal) * 100))
}

export function getSinglePurchaseDiscount(
  price: number,
  rules: DiscountRuleSummary[],
): SinglePurchaseDiscount | null {
  const rule = rules.find((candidate) => candidate.itemCount === 1)
  if (!rule || rule.fixedTotal >= price) return null

  const saveAmount = roundCurrency(price - rule.fixedTotal)
  return {
    name: rule.name,
    originalPrice: roundCurrency(price),
    salePrice: roundCurrency(rule.fixedTotal),
    saveAmount,
    savePercent: getSavePercent(saveAmount, price),
  }
}

export function getMultiPurchaseDiscounts(
  unitPrice: number,
  rules: DiscountRuleSummary[],
) {
  return rules
    .filter((rule) => rule.itemCount > 1)
    .map((rule): MultiPurchaseDiscount | null => {
      const regularTotal = roundCurrency(unitPrice * rule.itemCount)
      if (rule.fixedTotal >= regularTotal) return null

      const saveAmount = roundCurrency(regularTotal - rule.fixedTotal)
      return {
        name: rule.name,
        itemCount: rule.itemCount,
        fixedTotal: roundCurrency(rule.fixedTotal),
        regularTotal,
        saveAmount,
        savePercent: getSavePercent(saveAmount, regularTotal),
      }
    })
    .filter((discount): discount is MultiPurchaseDiscount => Boolean(discount))
    .sort((a, b) => b.savePercent - a.savePercent || a.itemCount - b.itemCount)
}

export function getBestMultiPurchaseDiscount(
  unitPrice: number,
  rules: DiscountRuleSummary[],
) {
  return getMultiPurchaseDiscounts(unitPrice, rules)[0] ?? null
}

export function formatMoney(value: number) {
  return `$${roundCurrency(value).toFixed(2)}`
}
