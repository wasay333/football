import 'server-only'

import { z } from 'zod'

const optionalSecretSchema = z.string().trim().min(1).optional()

const serverEnvSchema = z.object({
  JWT_SECRET: z.string().trim().min(1),
  STRIPE_SECRET_KEY: z.string().trim().min(1),
  STRIPE_WEBHOOK_SECRET: optionalSecretSchema,
  RESEND_API_KEY: optionalSecretSchema,
  RESEND_FROM_EMAIL: optionalSecretSchema,
  QUOTE_REQUEST_TO_EMAIL: optionalSecretSchema,
  TURNSTILE_SECRET_KEY: optionalSecretSchema,
  NEXT_PUBLIC_APP_URL: optionalSecretSchema,
  FEDEX_API_KEY: optionalSecretSchema,
  FEDEX_SECRET_KEY: optionalSecretSchema,
  FEDEX_TRACK_API_KEY: optionalSecretSchema,
  FEDEX_TRACK_SECRET_KEY: optionalSecretSchema,
  FEDEX_API_BASE_URL: optionalSecretSchema,
  FEDEX_TRACK_API_BASE_URL: optionalSecretSchema,
  FEDEX_GRANT_TYPE: optionalSecretSchema,
  FEDEX_TRACK_GRANT_TYPE: optionalSecretSchema,
  FEDEX_CHILD_KEY: optionalSecretSchema,
  FEDEX_CHILD_SECRET: optionalSecretSchema,
  FEDEX_TRACK_CHILD_KEY: optionalSecretSchema,
  FEDEX_TRACK_CHILD_SECRET: optionalSecretSchema,
})

type ServerEnv = z.infer<typeof serverEnvSchema>

let cachedEnv: ServerEnv | null = null

function getServerEnv() {
  if (!cachedEnv) {
    cachedEnv = serverEnvSchema.parse({
      JWT_SECRET: process.env.JWT_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
      RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
      QUOTE_REQUEST_TO_EMAIL: process.env.QUOTE_REQUEST_TO_EMAIL,
      TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      FEDEX_API_KEY: process.env.FEDEX_API_KEY,
      FEDEX_SECRET_KEY: process.env.FEDEX_SECRET_KEY,
      FEDEX_TRACK_API_KEY: process.env.FEDEX_TRACK_API_KEY,
      FEDEX_TRACK_SECRET_KEY: process.env.FEDEX_TRACK_SECRET_KEY,
      FEDEX_API_BASE_URL: process.env.FEDEX_API_BASE_URL,
      FEDEX_TRACK_API_BASE_URL: process.env.FEDEX_TRACK_API_BASE_URL,
      FEDEX_GRANT_TYPE: process.env.FEDEX_GRANT_TYPE,
      FEDEX_TRACK_GRANT_TYPE: process.env.FEDEX_TRACK_GRANT_TYPE,
      FEDEX_CHILD_KEY: process.env.FEDEX_CHILD_KEY,
      FEDEX_CHILD_SECRET: process.env.FEDEX_CHILD_SECRET,
      FEDEX_TRACK_CHILD_KEY: process.env.FEDEX_TRACK_CHILD_KEY,
      FEDEX_TRACK_CHILD_SECRET: process.env.FEDEX_TRACK_CHILD_SECRET,
    })
  }

  return cachedEnv
}

export function getOptionalServerEnv<K extends keyof ServerEnv>(key: K) {
  return getServerEnv()[key]
}

export function requireServerEnv<K extends keyof ServerEnv>(key: K) {
  const value = getServerEnv()[key]
  if (!value) {
    throw new Error(`${key} is not set`)
  }

  return value
}
