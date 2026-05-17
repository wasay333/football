import 'server-only'

import { cookies } from 'next/headers'
import { ADMIN_TOKEN_COOKIE, type AdminTokenPayload, verifyToken } from '@/lib/auth'
import { prisma } from '@/prisma'

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  const token = (await cookies()).get(ADMIN_TOKEN_COOKIE)?.value
  if (!token) {
    return null
  }

  try {
    const payload = await verifyToken(token)
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { email: true, isActive: true },
    })

    if (!user || !user.isActive || user.email !== payload.email) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
