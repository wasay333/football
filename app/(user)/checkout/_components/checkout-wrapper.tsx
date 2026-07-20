"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import type { Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/hooks/cart-context";
import { createPaymentIntent, type TrustedTotals } from "../_actions/create-payment-intent";
import CheckoutForm from "./checkout-form";

export default function CheckoutWrapper() {
  const { items } = useCart();
  const router = useRouter();
  const hasInitialized = useRef(false);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [trustedTotals, setTrustedTotals] = useState<TrustedTotals | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }

    if (!items.length) {
      router.replace("/cart");
      return;
    }

    hasInitialized.current = true;

    createPaymentIntent(
      items.map((item) => ({ productId: item.productId, quantity: item.quantity }))
    ).then((res) => {
      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.paymentIntentId && res.clientSecret && res.publishableKey && res.totals) {
        setPaymentIntentId(res.paymentIntentId);
        setClientSecret(res.clientSecret);
        setStripePromise(loadStripe(res.publishableKey));
        setTrustedTotals(res.totals);
      }
    });
  }, [items, router]);

  if (error) {
    return (
      <div className="checkout-state">
        <p className="checkout-state-error">{error}</p>
      </div>
    );
  }

  if (!paymentIntentId || !clientSecret || !stripePromise || !trustedTotals) {
    return (
      <div className="checkout-state">
        <span className="checkout-spinner checkout-spinner--dark" />
        <p>Preparing checkout…</p>
      </div>
    );
  }

  const appearance = {
    theme: "stripe" as const,
    variables: {
      colorPrimary: "#c9a84c",
      colorBackground: "#ffffff",
      colorText: "#111111",
      colorDanger: "#e53e3e",
      fontFamily: "Arial, sans-serif",
      borderRadius: "8px",
    },
  };

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance, loader: "auto" }}>
      <CheckoutForm
        paymentIntentId={paymentIntentId}
        totals={trustedTotals}
        onTotalsChange={setTrustedTotals}
      />
    </Elements>
  );
}
