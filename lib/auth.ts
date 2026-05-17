import { SignJWT, jwtVerify } from 'jose'
import { requireServerEnv } from '@/lib/env.server'

const secret = new TextEncoder().encode(requireServerEnv('JWT_SECRET'))

export interface AdminTokenPayload {
  id: string
  email: string
  [key: string]: string
}

export async function signToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(secret)
}

export async function verifyToken(token: string): Promise<AdminTokenPayload> {
  const { payload } = await jwtVerify(token, secret)
  return payload as unknown as AdminTokenPayload
}

export const ADMIN_TOKEN_COOKIE = 'admin_token'
