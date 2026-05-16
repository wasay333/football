const DISPOSABLE_EMAIL_DOMAINS = new Set([
  '10minutemail.com',
  'dispostable.com',
  'fakeinbox.com',
  'guerrillamail.com',
  'maildrop.cc',
  'mailinator.com',
  'temp-mail.org',
  'tempmail.com',
  'trashmail.com',
  'yopmail.com',
])

const SPAM_PATTERNS: Array<{ pattern: RegExp; weight: number }> = [
  { pattern: /\bseo\b/i, weight: 2 },
  { pattern: /\b(backlinks?|guest post|domain authority|ranking|rankings|traffic boost)\b/i, weight: 2 },
  { pattern: /\b(google ?search ?index|googlesearchindex|search register|search engine indexing)\b/i, weight: 3 },
  { pattern: /\b(website submission|search listing|lead generation)\b/i, weight: 2 },
  { pattern: /\b(bing|yahoo)\b/i, weight: 1 },
  { pattern: /https?:\/\/|www\./i, weight: 1 },
]

export const MIN_QUOTE_REQUEST_FILL_MS = 3000

function normalizeHostname(hostname: string) {
  return hostname.trim().toLowerCase().replace(/^www\./, '')
}

export function getEmailDomain(email: string) {
  const [, domain = ''] = email.trim().toLowerCase().split('@')
  return domain
}

export function isDisposableEmailDomain(email: string) {
  const domain = getEmailDomain(email)
  return Boolean(domain) && DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

export function hasMinimumFillTime(startedAt: FormDataEntryValue | null, minimumMs = MIN_QUOTE_REQUEST_FILL_MS) {
  if (typeof startedAt !== 'string') {
    return false
  }

  const startedAtMs = Number(startedAt)
  if (!Number.isFinite(startedAtMs)) {
    return false
  }

  return Date.now() - startedAtMs >= minimumMs
}

export function looksLikeSeoSpam(fields: Array<string | undefined>) {
  const haystack = fields
    .filter(Boolean)
    .join('\n')
    .trim()

  if (!haystack) {
    return false
  }

  let score = 0

  for (const signal of SPAM_PATTERNS) {
    if (signal.pattern.test(haystack)) {
      score += signal.weight
    }
  }

  return score >= 4
}

type TurnstileVerificationResult = {
  success: boolean
  errorCodes: string[]
}

type TurnstileSiteVerifyResponse = {
  success: boolean
  hostname?: string
  'error-codes'?: string[]
}

export async function verifyTurnstileToken({
  token,
  remoteIp,
}: {
  token: string
  remoteIp?: string
}): Promise<TurnstileVerificationResult> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY?.trim()

  if (!secretKey) {
    return { success: true, errorCodes: [] }
  }

  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] }
  }

  const formData = new FormData()
  formData.append('secret', secretKey)
  formData.append('response', token)

  if (remoteIp && remoteIp !== 'unknown') {
    formData.append('remoteip', remoteIp)
  }

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      cache: 'no-store',
    })

    const result = (await response.json()) as TurnstileSiteVerifyResponse
    if (!response.ok || !result.success) {
      return {
        success: false,
        errorCodes: result['error-codes'] ?? ['turnstile-request-failed'],
      }
    }

    const expectedHostname = process.env.NEXT_PUBLIC_APP_URL
      ? normalizeHostname(new URL(process.env.NEXT_PUBLIC_APP_URL).hostname)
      : undefined
    const responseHostname = result.hostname ? normalizeHostname(result.hostname) : undefined

    if (expectedHostname && responseHostname && expectedHostname !== responseHostname) {
      return {
        success: false,
        errorCodes: ['hostname-mismatch'],
      }
    }

    return { success: true, errorCodes: [] }
  } catch (error) {
    console.error('[turnstile] Verification request failed:', error)

    return {
      success: false,
      errorCodes: ['turnstile-request-failed'],
    }
  }
}
