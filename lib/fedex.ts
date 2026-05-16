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

const FEDEX_SANDBOX_BASE_URL = 'https://apis-sandbox.fedex.com'
const FEDEX_PRODUCTION_BASE_URL = 'https://apis.fedex.com'
const TOKEN_REFRESH_BUFFER_MS = 60 * 1000

const globalForFedEx = globalThis as typeof globalThis & {
  __foocapsFedExTokens?: Partial<Record<FedExScope, CachedFedExToken>>
}

function readEnv(name: string) {
  return process.env[name]?.trim()
}

function requireEnv(name: string) {
  const value = readEnv(name)
  if (!value) {
    throw new Error(`${name} is not set`)
  }

  return value
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

  const response = await fetch(`${baseUrl}/oauth/token`, {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded',
    },
    body,
    cache: 'no-store',
  })

  const payload = (await response.json()) as FedExAccessTokenResponse & FedExErrorResponse

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

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    body,
    cache: 'no-store',
  })

  const payload = (await response.json()) as T & FedExErrorResponse

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
