import { NextRequest, NextResponse } from 'next/server'
import { verifyToken, ADMIN_TOKEN_COOKIE } from '@/lib/auth'

const LOGIN_PATH = '/admin/auth/login'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Only guard /admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next()
  }

  // Always allow access to the login page itself
  if (pathname === LOGIN_PATH) {
    // If already logged in, redirect to dashboard
    const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value
    if (token) {
      try {
        await verifyToken(token)
        return NextResponse.redirect(new URL('/admin/dashboard', request.url))
      } catch {
        // Token invalid — let them reach the login page
      }
    }
    return NextResponse.next()
  }

  // Protect all other /admin/* routes
  const token = request.cookies.get(ADMIN_TOKEN_COOKIE)?.value

  if (!token) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url))
  }

  try {
    await verifyToken(token)
    return NextResponse.next()
  } catch {
    // Expired or tampered token — clear it and redirect
    const response = NextResponse.redirect(new URL(LOGIN_PATH, request.url))
    response.cookies.delete(ADMIN_TOKEN_COOKIE)
    return response
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
