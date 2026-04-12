"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/hooks/cart-context";
import { verifyPayment } from "../_actions/verify-payment";

type PaymentStatus = "loading" | "succeeded" | "failed" | "unknown";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("loading");

  const paymentIntentId = searchParams.get("payment_intent");

  useEffect(() => {
    if (!paymentIntentId) {
      setPaymentStatus("unknown");
      return;
    }

    verifyPayment(paymentIntentId).then(({ status }) => {
      if (status === "succeeded") {
        clearCart();
        setPaymentStatus("succeeded");
      } else if (status === "processing") {
        // Payment still processing — show as success, webhook will create order
        clearCart();
        setPaymentStatus("succeeded");
      } else {
        setPaymentStatus("failed");
      }
    });
  }, [paymentIntentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (paymentStatus === "loading") {
    return (
      <div className="success-page">
        <div className="success-card">
          <p className="success-sub">Confirming your payment…</p>
        </div>
      </div>
    );
  }

  if (paymentStatus === "failed") {
    return (
      <div className="success-page">
        <div className="success-card">
          <h1 className="success-title">Payment Not Completed</h1>
          <p className="success-sub">
            Your payment was not successful. No charge has been made.
          </p>
          <div className="success-actions">
            <Link href="/checkout" className="success-btn-primary">Try Again</Link>
            <Link href="/cart" className="success-btn-secondary">Back to Cart</Link>
          </div>
        </div>
      </div>
    );
  }

  if (paymentStatus === "unknown") {
    return (
      <div className="success-page">
        <div className="success-card">
          <h1 className="success-title">Something went wrong</h1>
          <p className="success-sub">We couldn&apos;t verify your payment. Please contact support.</p>
          <div className="success-actions">
            <Link href="/" className="success-btn-secondary">Back to Home</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="success-page">
      <div className="success-card">
        {/* Animated checkmark */}
        <div className="success-icon">
          <svg viewBox="0 0 52 52" fill="none">
            <circle className="success-circle" cx="26" cy="26" r="25" stroke="currentColor" strokeWidth="2" fill="none" />
            <path className="success-check" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14 26l8 8 16-16" fill="none" />
          </svg>
        </div>

        <p className="success-eyebrow">Foocaps</p>
        <h1 className="success-title">Order Confirmed!</h1>
        <p className="success-sub">
          Thank you for your purchase. We&apos;ll send a confirmation to your email shortly and notify you when your cap ships.
        </p>

        {paymentIntentId && (
          <p className="success-ref">
            Reference: <span>{paymentIntentId.slice(-8).toUpperCase()}</span>
          </p>
        )}

        <div className="success-actions">
          <Link href="/product" className="success-btn-primary">Continue Shopping</Link>
          <Link href="/" className="success-btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
