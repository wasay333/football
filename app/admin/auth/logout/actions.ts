'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { ADMIN_TOKEN_COOKIE } from '@/lib/auth'

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(ADMIN_TOKEN_COOKIE)
  redirect('/admin/auth/login')
}
