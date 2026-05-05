'use server'

import { headers } from 'next/headers'
import { Resend } from 'resend'
import { z } from 'zod'
import {
  buildQuoteRequestAdminEmail,
  buildQuoteRequestConfirmationEmail,
} from '@/lib/email/quote-request'
import { checkRateLimit } from '@/lib/rate-limit'

const requestTypeOptions = [
  'Bulk Team Order',
  'Event Merch',
  'Wholesale Inquiry',
] as const

const QuoteRequestSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(80, 'Name is too long'),
  email: z.string().trim().email('Enter a valid email address'),
  phone: z.string().trim().max(40, 'Phone number is too long').optional().or(z.literal('')),
  requestType: z
    .string()
    .refine((value) => requestTypeOptions.includes(value as (typeof requestTypeOptions)[number]), {
      message: 'Select a request type',
    }),
  quantity: z.coerce
    .number()
    .int('Quantity must be a whole number')
    .min(1, 'Quantity must be at least 1')
    .max(5000, 'Quantity is too large'),
  neededBy: z.string().trim().max(40, 'Date is too long').optional().or(z.literal('')),
  details: z
    .string()
    .trim()
    .min(20, 'Tell us a bit more so we can prepare an accurate quote')
    .max(1500, 'Details are too long'),
  website: z.string().max(0).optional().or(z.literal('')),
})

export type QuoteRequestState = {
  success?: boolean
  message?: string
  errors?: {
    name?: string[]
    email?: string[]
    phone?: string[]
    requestType?: string[]
    quantity?: string[]
    neededBy?: string[]
    details?: string[]
    form?: string[]
  }
} | null

function getClientIp(requestHeaders: Headers) {
  const forwardedFor = requestHeaders.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown'
  }

  return requestHeaders.get('x-real-ip') ?? requestHeaders.get('cf-connecting-ip') ?? 'unknown'
}

export async function submitQuoteAction(
  prevState: QuoteRequestState,
  formData: FormData,
): Promise<QuoteRequestState> {
  const requestHeaders = await headers()
  const clientIp = getClientIp(requestHeaders)
  const rateLimit = checkRateLimit({
    key: `quote-request:${clientIp}`,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  })

  if (!rateLimit.allowed) {
    return {
      success: false,
      errors: {
        form: ['Too many quote requests from this connection. Please try again in about an hour.'],
      },
    }
  }

  const raw = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    requestType: formData.get('requestType'),
    quantity: formData.get('quantity'),
    neededBy: formData.get('neededBy'),
    details: formData.get('details'),
    website: formData.get('website'),
  }

  const result = QuoteRequestSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    }
  }

  if (result.data.website) {
    return {
      success: true,
      message: 'Your request has been received. We will be in touch by email.',
    }
  }

  const resendApiKey = process.env.RESEND_API_KEY
  const resendFromEmail = process.env.RESEND_FROM_EMAIL ?? 'Foocaps <onboarding@resend.dev>'
  const quoteToEmail = process.env.QUOTE_REQUEST_TO_EMAIL ?? 'info@foocaps.com'

  if (!resendApiKey) {
    console.error('[quote-request] RESEND_API_KEY missing')
    return {
      success: false,
      errors: {
        form: ['Quote requests are temporarily unavailable. Please try again shortly.'],
      },
    }
  }

  const resend = new Resend(resendApiKey)

  try {
    await resend.emails.send({
      from: resendFromEmail,
      to: quoteToEmail,
      replyTo: result.data.email,
      subject: `Quote Request - ${result.data.name}`,
      html: buildQuoteRequestAdminEmail(result.data),
    })

    try {
      await resend.emails.send({
        from: resendFromEmail,
        to: result.data.email,
        subject: 'We received your quote request',
        html: buildQuoteRequestConfirmationEmail(result.data),
      })
    } catch (confirmationError) {
      console.error('[quote-request] Failed to send confirmation email:', confirmationError)
    }

    return {
      success: true,
      message: 'Your quote request has been sent. We will reply by email soon.',
    }
  } catch (error) {
    console.error('[quote-request] Failed to send quote request email:', error)

    return {
      success: false,
      errors: {
        form: ['We could not send your request right now. Please try again in a few minutes.'],
      },
    }
  }
}
