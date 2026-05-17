type FedExAccessTokenResponse = {
  access_token: string
  token_type: 'bearer' | string
  expires_in: number
  scope?: string
}

type FedExErrorResponse = {
  errors?: Array<{
    code?: string
    message?: string
    parameterList?: Array<{ key?: string; value?: string }>
  }>
}

type CachedFedExToken = {
  accessToken: string
  expiresAt: number
}

type FedExScope = 'shipping' | 'tracking'

type FedExRequestInit = Omit<RequestInit, 'body' | 'headers'> & {
  body?: BodyInit | object
  headers?: HeadersInit
}

import { getOptionalServerEnv, requireServerEnv } from '@/lib/env.server'

const FEDEX_SANDBOX_BASE_URL = 'https://apis-sandbox.fedex.com'
const FEDEX_PRODUCTION_BASE_URL = 'https://apis.fedex.com'
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000
const FEDEX_REQUEST_TIMEOUT_MS = 15_000
const FEDEX_REQUEST_MAX_RETRIES = 2
const FEDEX_RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504])

const globalForFedEx = globalThis as typeof globalThis & {
  __foocapsFedExTokens?: Partial<Record<FedExScope, CachedFedExToken>>
}

function readEnv(name: string) {
  return getOptionalServerEnv(name as Parameters<typeof getOptionalServerEnv>[0])
}

function requireEnv(name: string) {
  return requireServerEnv(name as Parameters<typeof requireServerEnv>[0])
}

function readPositiveIntEnv(name: string, fallback: number) {
  const value = Number(readEnv(name))
  return Number.isInteger(value) && value > 0 ? value : fallback
}

function getFedExRequestTimeoutMs() {
  return readPositiveIntEnv('FEDEX_REQUEST_TIMEOUT_MS', FEDEX_REQUEST_TIMEOUT_MS)
}

function getFedExRequestMaxRetries() {
  return readPositiveIntEnv('FEDEX_REQUEST_MAX_RETRIES', FEDEX_REQUEST_MAX_RETRIES)
}

function buildTimedSignal(signal?: AbortSignal) {
  const timeoutSignal = AbortSignal.timeout(getFedExRequestTimeoutMs())
  return signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal
}

function isRetryableFetchError(error: unknown) {
  return (
    (error instanceof Error &&
      (error.name === 'AbortError' || error.name === 'TimeoutError' || error instanceof TypeError)) ||
    false
  )
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function parseFedExResponse<T>(response: Response) {
  const text = await response.text()
  if (!text) {
    return {} as T & FedExErrorResponse
  }

  try {
    return JSON.parse(text) as T & FedExErrorResponse
  } catch {
    throw new Error(`FedEx returned a non-JSON response with status ${response.status}.`)
  }
}

async function performFedExFetch(
  url: string,
  init: RequestInit,
  operationLabel: string,
) {
  const maxRetries = getFedExRequestMaxRetries()

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(url, {
        ...init,
        signal: buildTimedSignal(init.signal ?? undefined),
      })

      if (!FEDEX_RETRYABLE_STATUS_CODES.has(response.status) || attempt === maxRetries) {
        return response
      }
    } catch (error) {
      if (!isRetryableFetchError(error) || attempt === maxRetries) {
        throw error
      }
    }

    await delay(250 * (attempt + 1))
  }

  throw new Error(`FedEx ${operationLabel} request failed after multiple attempts.`)
}

export function getFedExBaseUrl(scope: FedExScope = 'shipping') {
  if (scope === 'tracking') {
    return readEnv('FEDEX_TRACK_API_BASE_URL') ?? readEnv('FEDEX_API_BASE_URL') ?? FEDEX_SANDBOX_BASE_URL
  }

  return readEnv('FEDEX_API_BASE_URL') ?? FEDEX_SANDBOX_BASE_URL
}

export function isFedExSandbox(scope: FedExScope = 'shipping') {
  return getFedExBaseUrl(scope) === FEDEX_SANDBOX_BASE_URL
}

export function getFedExConfig(scope: FedExScope = 'shipping') {
  const isTracking = scope === 'tracking'
  return {
    apiKey: isTracking
      ? readEnv('FEDEX_TRACK_API_KEY') ?? requireEnv('FEDEX_API_KEY')
      : requireEnv('FEDEX_API_KEY'),
    secretKey: isTracking
      ? readEnv('FEDEX_TRACK_SECRET_KEY') ?? requireEnv('FEDEX_SECRET_KEY')
      : requireEnv('FEDEX_SECRET_KEY'),
    accountNumber: readEnv('FEDEX_ACCOUNT_NUMBER') ?? '',
    baseUrl: getFedExBaseUrl(scope),
    grantType:
      readEnv(isTracking ? 'FEDEX_TRACK_GRANT_TYPE' : 'FEDEX_GRANT_TYPE') ??
      readEnv('FEDEX_GRANT_TYPE') ??
      'client_credentials',
    childKey:
      readEnv(isTracking ? 'FEDEX_TRACK_CHILD_KEY' : 'FEDEX_CHILD_KEY') ??
      (isTracking ? readEnv('FEDEX_CHILD_KEY') : '') ??
      '',
    childSecret:
      readEnv(isTracking ? 'FEDEX_TRACK_CHILD_SECRET' : 'FEDEX_CHILD_SECRET') ??
      (isTracking ? readEnv('FEDEX_CHILD_SECRET') : '') ??
      '',
  }
}

export async function getFedExAccessToken(scope: FedExScope = 'shipping') {
  const cachedToken = globalForFedEx.__foocapsFedExTokens?.[scope]
  if (cachedToken && cachedToken.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken.accessToken
  }

  const { apiKey, secretKey, baseUrl, grantType, childKey, childSecret } = getFedExConfig(scope)
  const body = new URLSearchParams({
    grant_type: grantType,
    client_id: apiKey,
    client_secret: secretKey,
  })

  if (childKey) {
    body.append('child_key', childKey)
  }

  if (childSecret) {
    body.append('child_secret', childSecret)
  }

  const response = await performFedExFetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  }, `auth:${scope}`)

  const payload = await parseFedExResponse<FedExAccessTokenResponse>(response)

  if (!response.ok || !payload.access_token) {
    const message =
      payload.errors?.map((error) => error.message).filter(Boolean).join('; ') ||
      'Unable to authenticate with FedEx.'

    throw new Error(`[FedEx auth:${scope}:${grantType}] ${message}`)
  }

  globalForFedEx.__foocapsFedExTokens = {
    ...(globalForFedEx.__foocapsFedExTokens ?? {}),
    [scope]: {
    accessToken: payload.access_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    },
  }

  return payload.access_token
}

export async function fedexRequest<T>(
  path: string,
  init: FedExRequestInit = {},
  scope: FedExScope = 'shipping',
): Promise<T> {
  const accessToken = await getFedExAccessToken(scope)
  const { baseUrl } = getFedExConfig(scope)
  const headers = new Headers(init.headers)

  headers.set('authorization', `Bearer ${accessToken}`)
  headers.set('x-customer-transaction-id', crypto.randomUUID())

  let body: BodyInit | undefined
  if (init.body instanceof URLSearchParams || init.body instanceof FormData || typeof init.body === 'string') {
    body = init.body
  } else if (init.body) {
    headers.set('content-type', 'application/json')
    body = JSON.stringify(init.body)
  }

  const response = await performFedExFetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    body,
    cache: 'no-store',
  }, `${scope}:${path}`)

  const payload = await parseFedExResponse<T>(response)

  if (!response.ok) {
    const message =
      payload.errors?.map((error) => error.message).filter(Boolean).join('; ') ||
      `FedEx request failed with status ${response.status}.`

    throw new Error(message)
  }

  return payload
}

export const FEDEX_URLS = {
  sandbox: FEDEX_SANDBOX_BASE_URL,
  production: FEDEX_PRODUCTION_BASE_URL,
} as const
