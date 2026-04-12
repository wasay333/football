'use server'

import { z } from 'zod'
import { prisma } from '@/prisma'
import bcrypt from 'bcryptjs'
import { signToken, ADMIN_TOKEN_COOKIE } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

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
  const raw = {
    email: formData.get('email'),
    password: formData.get('password'),
  }

  const result = LoginSchema.safeParse(raw)
  if (!result.success) {
    return { errors: result.error.flatten().fieldErrors }
  }

  const user = await prisma.user.findUnique({
    where: { email: result.data.email },
  })

  // Generic message — don't reveal whether email exists
  if (!user || !user.isActive) {
    return { errors: { form: ['Invalid email or password'] } }
  }

  const passwordValid = await bcrypt.compare(result.data.password, user.password)
  if (!passwordValid) {
    return { errors: { form: ['Invalid email or password'] } }
  }

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
