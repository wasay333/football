export function buildOrderTrackingUrl(orderNumber: string, customerEmail: string) {
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? process.env.APP_URL ?? '').trim().replace(/\/$/, '')

  if (!siteUrl || !orderNumber || !customerEmail) {
    return ''
  }

  return `${siteUrl}/track?order=${encodeURIComponent(orderNumber)}&email=${encodeURIComponent(customerEmail)}`
}
