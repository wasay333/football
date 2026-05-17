import { isIP } from 'node:net'

function firstValidForwardedIp(forwardedFor: string | null) {
  if (!forwardedFor) {
    return null
  }

  for (const candidate of forwardedFor.split(',')) {
    const value = candidate.trim()
    if (isIP(value)) {
      return value
    }
  }

  return null
}

export function getClientIpFromHeaders(requestHeaders: Headers) {
  const trustedProxyHeaders = [
    requestHeaders.get('cf-connecting-ip'),
    requestHeaders.get('x-real-ip'),
    firstValidForwardedIp(requestHeaders.get('x-forwarded-for')),
  ]

  for (const value of trustedProxyHeaders) {
    if (value && isIP(value)) {
      return value
    }
  }

  return 'unknown'
}
