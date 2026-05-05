'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import QuoteRequestForm from '@/components/quote-request-form'

gsap.registerPlugin(ScrollTrigger)

export default function ContactPageClient() {
  const heroRef = useRef<HTMLElement>(null)
  const formRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      const heroEls = heroRef.current?.querySelectorAll('.contact-hero-el')
      if (heroEls) {
        gsap.fromTo(
          heroEls,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.14,
            ease: 'power3.out',
          },
        )
      }

      const formEls = formRef.current?.querySelectorAll('.contact-form-el')
      if (formEls) {
        gsap.fromTo(
          formEls,
          { y: 40, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: formRef.current,
              start: 'top 82%',
            },
          },
        )
      }
    })

    const rafId = requestAnimationFrame(() => ScrollTrigger.refresh())
    return () => {
      cancelAnimationFrame(rafId)
      ctx.revert()
    }
  }, [])

  return (
    <div className="contact-page">
      <section ref={heroRef} className="contact-hero">
        <div className="contact-hero-inner">
          <span className="ap-eyebrow contact-hero-el">Contact</span>
          <h1 className="contact-hero-title contact-hero-el">
            START YOUR NEXT
            <br />
            <span>FOOCAPS PROJECT</span>
          </h1>
          <p className="contact-hero-sub contact-hero-el">
            Tell us what you need and we will reply by email with pricing, timing,
            and the best next steps for your order.
          </p>
        </div>
      </section>

      <section ref={formRef} className="contact-form-section">
        <div className="contact-form-shell">
          <div className="ap-quote-copy contact-form-el">
            <span className="ap-eyebrow">Request a Quote</span>
            <h2 className="ap-quote-title">
              BULK ORDERS,
              <br />
              <span>EVENT DROPS, WHOLESALE</span>
            </h2>
            <p className="ap-quote-sub">
              Share your quantity, timing, and project details. We use this page for
              team orders, event merchandise, and wholesale conversations.
            </p>
            <div className="ap-quote-points">
              <div className="ap-quote-point">Bulk team and supporter group orders</div>
              <div className="ap-quote-point">Event merchandise and launch drops</div>
              <div className="ap-quote-point">Wholesale inquiries for stores and partners</div>
            </div>
          </div>

          <div className="ap-quote-card contact-form-el">
            <QuoteRequestForm />
          </div>
        </div>
      </section>
    </div>
  )
}
