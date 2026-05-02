import { NextResponse } from 'next/server'

export function GET() {
  return new NextResponse(null, {
    status: 308,
    headers: {
      Location: '/foocaps-search-favicon.png',
    },
  })
}
