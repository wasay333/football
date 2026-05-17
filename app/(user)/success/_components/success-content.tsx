"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/hooks/cart-context";
import { verifyPayment } from "../_actions/verify-payment";

type PaymentStatus = "succeeded" | "processing" | "failed";

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);

  const paymentIntentId = searchParams.get("payment_intent");

  useEffect(() => {
    if (!paymentIntentId) {
      return;
    }

    verifyPayment(paymentIntentId).then(({ status }) => {
      if (status === "succeeded") {
        clearCart();
        setPaymentStatus("succeeded");
      } else if (status === "processing") {
        clearCart();
        setPaymentStatus("processing");
      } else {
        setPaymentStatus("failed");
      }
    });
  }, [paymentIntentId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!paymentIntentId) {
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

  if (paymentStatus === null) {
    return (
      <div className="success-page">
        <div className="success-card">
          <p className="success-sub">Confirming your payment...</p>
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

  if (paymentStatus === "processing") {
    return (
      <div className="success-page">
        <div className="success-card">
          <h1 className="success-title">Payment Processing</h1>
          <p className="success-sub">
            Your payment is being confirmed. We&apos;ll email you once your order is placed and follow up when your cap ships.
          </p>
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

        <p className="success-ref">
          Reference: <span>{paymentIntentId.slice(-8).toUpperCase()}</span>
        </p>

        <div className="success-actions">
          <Link href="/product" className="success-btn-primary">Continue Shopping</Link>
          <Link href="/" className="success-btn-secondary">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
