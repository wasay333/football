'use client'

import { useActionState, useEffect, useRef } from 'react'
import { useFormStatus } from 'react-dom'
import { submitQuoteAction, type QuoteRequestState } from '@/app/(user)/contact/actions'

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending} className="ap-quote-submit">
      {pending ? 'Sending Request...' : 'Request a Quote'}
    </button>
  )
}

export default function QuoteRequestForm() {
  const [state, formAction] = useActionState<QuoteRequestState, FormData>(submitQuoteAction, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset()
    }
  }, [state?.success])

  return (
    <form ref={formRef} action={formAction} className="ap-quote-form">
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

      <div className="ap-quote-field ap-quote-field--full">
        <p className="ap-quote-note">
          This form is rate limited to protect against spam. If you have an urgent request, email
          us directly after submitting and we will match it up with your quote.
        </p>
      </div>

      <div className="ap-quote-field ap-quote-field--full">
        <SubmitButton />
      </div>
    </form>
  )
}
