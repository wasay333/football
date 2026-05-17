'use server'

import { z } from 'zod'
import { prisma } from '@/prisma'
import bcrypt from 'bcryptjs'
import { signToken, ADMIN_TOKEN_COOKIE } from '@/lib/auth'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit'
import { getClientIpFromHeaders } from '@/lib/request-client'

const INVALID_LOGIN_MESSAGE = 'Invalid email or password'
const LOGIN_RATE_LIMIT_MESSAGE = 'Too many login attempts. Please wait a few minutes and try again.'
const DUMMY_PASSWORD_HASH = '$2a$10$zIKSx8M0L5WTKUTwyR1FROv.Y8x7B2MB7cH8KPlYx9s7Y2J4M9H4S'

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters'),
})

export type LoginState = {
  errors?: {
    email?: string[]
    password?: string[]
    form?: string[]
  }
} | null

export async function loginAction(
  prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  void prevState

  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const result = LoginSchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const requestHeaders = await headers()
  const clientIp = getClientIpFromHeaders(requestHeaders)
  const normalizedEmail = result.data.email.trim().toLowerCase()
  const ipRateLimitKey = `admin-login:ip:${clientIp}`
  const emailRateLimitKey = `admin-login:email:${normalizedEmail}`

  const ipRateLimit = checkRateLimit({
    key: ipRateLimitKey,
    limit: 10,
    windowMs: 15 * 60 * 1000,
  })
  const emailRateLimit = checkRateLimit({
    key: emailRateLimitKey,
    limit: 5,
    windowMs: 15 * 60 * 1000,
  })

  if (!ipRateLimit.allowed || !emailRateLimit.allowed) {
    return { errors: { form: [LOGIN_RATE_LIMIT_MESSAGE] } }
  }

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  })

  // Generic message — don't reveal whether email exists
  if (!user || !user.isActive) {
    await bcrypt.compare(result.data.password, DUMMY_PASSWORD_HASH)
    return { errors: { form: [INVALID_LOGIN_MESSAGE] } }
  }

  const passwordValid = await bcrypt.compare(result.data.password, user.password)
  if (!passwordValid) {
    return { errors: { form: [INVALID_LOGIN_MESSAGE] } }
  }

  resetRateLimit(ipRateLimitKey)
  resetRateLimit(emailRateLimitKey)

  const token = await signToken({ id: user.id, email: user.email })

  const cookieStore = await cookies()
  cookieStore.set(ADMIN_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  })

  redirect('/admin/dashboard')
}
