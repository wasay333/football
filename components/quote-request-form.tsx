'use client'

import Script from 'next/script'
import { useActionState, useEffect, useEffectEvent, useRef, useState } from 'react'
import { useFormStatus } from 'react-dom'
import { submitQuoteAction, type QuoteRequestState } from '@/app/(user)/contact/actions'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string
          theme?: 'auto' | 'light' | 'dark'
          size?: 'normal' | 'compact' | 'flexible'
          callback?: (token: string) => void
          'error-callback'?: () => void
          'expired-callback'?: () => void
          'timeout-callback'?: () => void
        },
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

function SubmitButton({
  requiresVerification,
  hasVerificationToken,
}: {
  requiresVerification: boolean
  hasVerificationToken: boolean
}) {
  const { pending } = useFormStatus()
  const disabled = pending || (requiresVerification && !hasVerificationToken)

  return (
    <button type="submit" disabled={disabled} className="ap-quote-submit">
      {pending ? 'Sending Request...' : 'Request a Quote'}
    </button>
  )
}

export default function QuoteRequestForm() {
  const [state, formAction] = useActionState<QuoteRequestState, FormData>(submitQuoteAction, null)
  const formRef = useRef<HTMLFormElement>(null)
  const startedAtRef = useRef<HTMLInputElement>(null)
  const turnstileContainerRef = useRef<HTMLDivElement>(null)
  const turnstileWidgetIdRef = useRef<string | undefined>(undefined)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? ''
  const requiresVerification = Boolean(turnstileSiteKey)
  const [turnstileScriptReady, setTurnstileScriptReady] = useState(false)
  const [turnstileToken, setTurnstileToken] = useState('')
  const [turnstileError, setTurnstileError] = useState<string | null>(null)

  const resetStartedAt = useEffectEvent(() => {
    if (startedAtRef.current) {
      startedAtRef.current.value = Date.now().toString()
    }
  })

  const resetTurnstile = useEffectEvent(() => {
    if (turnstileWidgetIdRef.current) {
      window.turnstile?.reset(turnstileWidgetIdRef.current)
    }

    setTurnstileToken('')
  })

  const renderTurnstile = useEffectEvent(() => {
    if (
      !requiresVerification ||
      !turnstileScriptReady ||
      !turnstileContainerRef.current ||
      !window.turnstile ||
      turnstileWidgetIdRef.current
    ) {
      return
    }

    turnstileWidgetIdRef.current = window.turnstile.render(turnstileContainerRef.current, {
      sitekey: turnstileSiteKey,
      theme: 'light',
      size: 'flexible',
      callback: (token) => {
        setTurnstileToken(token)
        setTurnstileError(null)
      },
      'error-callback': () => {
        setTurnstileToken('')
        setTurnstileError('Spam check could not load. Refresh the page and try again.')
      },
      'expired-callback': () => {
        setTurnstileError('Spam check expired. Please complete it again.')
        resetTurnstile()
      },
      'timeout-callback': () => {
        setTurnstileError('Spam check timed out. Please complete it again.')
        resetTurnstile()
      },
    })
  })

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
      resetStartedAt()
      resetTurnstile()
    }
  }, [state?.success])

  useEffect(() => {
    renderTurnstile()
  }, [requiresVerification, turnstileScriptReady])

  useEffect(() => {
    resetStartedAt()
  }, [])

  useEffect(() => {
    return () => {
      if (turnstileWidgetIdRef.current) {
        window.turnstile?.remove(turnstileWidgetIdRef.current)
        turnstileWidgetIdRef.current = undefined
      }
    }
  }, [])

  return (
    <form ref={formRef} action={formAction} className="ap-quote-form">
      {requiresVerification && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setTurnstileScriptReady(true)}
        />
      )}

      <input ref={startedAtRef} type="hidden" name="startedAt" defaultValue="" />
      <input type="hidden" name="turnstileToken" value={turnstileToken} readOnly />

      {state?.errors?.form && (
        <div className="ap-quote-feedback ap-quote-feedback--error">{state.errors.form[0]}</div>
      )}

      {state?.success && state.message && (
        <div className="ap-quote-feedback ap-quote-feedback--success">{state.message}</div>
      )}

      <div className="ap-quote-field">
        <label htmlFor="quote-name">Full Name</label>
        <input
          id="quote-name"
          name="name"
          type="text"
          placeholder="Your name"
          required
          minLength={2}
          maxLength={80}
          autoComplete="name"
          aria-invalid={state?.errors?.name ? "true" : "false"}
          aria-describedby={state?.errors?.name ? "quote-name-error" : undefined}
        />
        {state?.errors?.name && (
          <p id="quote-name-error" className="ap-quote-error">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="ap-quote-field">
        <label htmlFor="quote-email">Email</label>
        <input
          id="quote-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          maxLength={120}
          autoComplete="email"
          inputMode="email"
          aria-invalid={state?.errors?.email ? "true" : "false"}
          aria-describedby={state?.errors?.email ? "quote-email-error" : undefined}
        />
        {state?.errors?.email && (
          <p id="quote-email-error" className="ap-quote-error">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="ap-quote-field">
        <label htmlFor="quote-phone">Phone</label>
        <input
          id="quote-phone"
          name="phone"
          type="tel"
          placeholder="+1 234 567 890"
          maxLength={40}
          autoComplete="tel"
          inputMode="tel"
          aria-invalid={state?.errors?.phone ? "true" : "false"}
          aria-describedby={state?.errors?.phone ? "quote-phone-error" : undefined}
        />
        {state?.errors?.phone && (
          <p id="quote-phone-error" className="ap-quote-error">{state.errors.phone[0]}</p>
        )}
      </div>

      <div className="ap-quote-field">
        <label htmlFor="quote-request-type">Request Type</label>
        <div className="ap-quote-select-wrap">
          <select
            id="quote-request-type"
            name="requestType"
            defaultValue=""
            required
            className="ap-quote-select"
            aria-invalid={state?.errors?.requestType ? "true" : "false"}
            aria-describedby={state?.errors?.requestType ? "quote-request-type-error" : undefined}
          >
            <option value="" disabled>
              Select a request type
            </option>
            <option value="Bulk Team Order">Bulk Team Order</option>
            <option value="Event Merch">Event Merch</option>
            <option value="Wholesale Inquiry">Wholesale Inquiry</option>
          </select>
          <span className="ap-quote-select-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9L12 15L18 9"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
        {state?.errors?.requestType && (
          <p id="quote-request-type-error" className="ap-quote-error">{state.errors.requestType[0]}</p>
        )}
      </div>

      <div className="ap-quote-field">
        <label htmlFor="quote-quantity">Estimated Quantity</label>
        <input
          id="quote-quantity"
          name="quantity"
          type="number"
          min="1"
          max="5000"
          step="1"
          required
          placeholder="50"
          inputMode="numeric"
          aria-invalid={state?.errors?.quantity ? "true" : "false"}
          aria-describedby={state?.errors?.quantity ? "quote-quantity-error" : undefined}
        />
        {state?.errors?.quantity && (
          <p id="quote-quantity-error" className="ap-quote-error">{state.errors.quantity[0]}</p>
        )}
      </div>

      <div className="ap-quote-field">
        <label htmlFor="quote-needed-by">Needed By</label>
        <input
          id="quote-needed-by"
          name="neededBy"
          type="date"
          aria-invalid={state?.errors?.neededBy ? "true" : "false"}
          aria-describedby={state?.errors?.neededBy ? "quote-needed-by-error" : undefined}
        />
        {state?.errors?.neededBy && (
          <p id="quote-needed-by-error" className="ap-quote-error">{state.errors.neededBy[0]}</p>
        )}
      </div>

      <div className="ap-quote-field ap-quote-field--full">
        <label htmlFor="quote-details">Tell Us About Your Project</label>
        <textarea
          id="quote-details"
          name="details"
          rows={6}
          placeholder="Share the team, event, style direction, timeline, or anything else that will help us price your request."
          required
          minLength={20}
          maxLength={1500}
          aria-invalid={state?.errors?.details ? "true" : "false"}
          aria-describedby={state?.errors?.details ? "quote-details-error" : undefined}
        />
        {state?.errors?.details && (
          <p id="quote-details-error" className="ap-quote-error">{state.errors.details[0]}</p>
        )}
      </div>

      <div className="ap-quote-honeypot" aria-hidden="true">
        <label htmlFor="quote-website">Leave this field empty</label>
        <input id="quote-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {requiresVerification && (
        <div className="ap-quote-field ap-quote-field--full">
          <label>Spam Check</label>
          <div ref={turnstileContainerRef} className="ap-turnstile" />
          {turnstileError && <p className="ap-quote-error">{turnstileError}</p>}
        </div>
      )}

      <div className="ap-quote-field ap-quote-field--full">
        <p className="ap-quote-note">
          This form is protected with rate limiting, bot traps, and spam verification. If you have an urgent request, email
          us directly after submitting and we will match it up with your quote.
        </p>
      </div>

      <div className="ap-quote-field ap-quote-field--full">
        <SubmitButton
          requiresVerification={requiresVerification}
          hasVerificationToken={!requiresVerification || Boolean(turnstileToken)}
        />
      </div>
    </form>
  )
}
