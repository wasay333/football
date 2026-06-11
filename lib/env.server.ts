import 'server-only'

import { z } from 'zod'

const envSchemas = {
  JWT_SECRET: z.string().trim().min(1),
  STRIPE_SECRET_KEY: z.string().trim().min(1),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().trim().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().trim().min(1).optional(),
  RESEND_API_KEY: z.string().trim().min(1).optional(),
  RESEND_FROM_EMAIL: z.string().trim().min(1).optional(),
  QUOTE_REQUEST_TO_EMAIL: z.string().trim().min(1).optional(),
  TURNSTILE_SECRET_KEY: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().trim().min(1).optional(),
  FEDEX_API_KEY: z.string().trim().min(1).optional(),
  FEDEX_SECRET_KEY: z.string().trim().min(1).optional(),
  FEDEX_TRACK_API_KEY: z.string().trim().min(1).optional(),
  FEDEX_TRACK_SECRET_KEY: z.string().trim().min(1).optional(),
  FEDEX_API_BASE_URL: z.string().trim().min(1).optional(),
  FEDEX_TRACK_API_BASE_URL: z.string().trim().min(1).optional(),
  FEDEX_ACCOUNT_NUMBER: z.string().trim().min(1).optional(),
  FEDEX_GRANT_TYPE: z.string().trim().min(1).optional(),
  FEDEX_TRACK_GRANT_TYPE: z.string().trim().min(1).optional(),
  FEDEX_CHILD_KEY: z.string().trim().min(1).optional(),
  FEDEX_CHILD_SECRET: z.string().trim().min(1).optional(),
  FEDEX_TRACK_CHILD_KEY: z.string().trim().min(1).optional(),
  FEDEX_TRACK_CHILD_SECRET: z.string().trim().min(1).optional(),
  FEDEX_REQUEST_TIMEOUT_MS: z.string().trim().min(1).optional(),
  FEDEX_REQUEST_MAX_RETRIES: z.string().trim().min(1).optional(),
} as const

type EnvKey = keyof typeof envSchemas
type EnvValue<K extends EnvKey> = z.infer<(typeof envSchemas)[K]>

const envCache = new Map<EnvKey, string | undefined>()

function readEnv<K extends EnvKey>(key: K): EnvValue<K> {
  if (envCache.has(key)) {
    return envCache.get(key) as EnvValue<K>
  }

  const parsed = envSchemas[key].parse(process.env[key])
  envCache.set(key, parsed)
  return parsed as EnvValue<K>
}

export function getOptionalServerEnv<K extends EnvKey>(key: K) {
  return readEnv(key)
}

export function requireServerEnv<K extends EnvKey>(key: K) {
  const value = readEnv(key)
  if (!value) {
    throw new Error(`${key} is not set`)
  }

  return value
}
