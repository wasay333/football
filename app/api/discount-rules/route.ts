import { NextResponse } from 'next/server'
import { getActiveDiscountRules } from '@/lib/discount-rules'

export const dynamic = 'force-dynamic'

export async function GET() {
  const rules = await getActiveDiscountRules()
  return NextResponse.json({ rules })
}
