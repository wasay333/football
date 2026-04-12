"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { useCart } from "@/hooks/cart-context";
import { createPaymentIntent } from "../_actions/create-payment-intent";
import CheckoutForm from "./checkout-form";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export type TrustedTotals = {
  subtotal: number;
  shipping: number;
  total: number;
};

export default function CheckoutWrapper() {
  const { items } = useCart();
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [trustedTotals, setTrustedTotals] = useState<TrustedTotals | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!items.length) {
      router.replace("/cart");
      return;
    }

    // Send only productId + quantity + size — backend fetches trusted prices from DB
    createPaymentIntent(
      items.map((i) => ({ productId: i.productId, quantity: i.quantity, size: i.size }))
    ).then((res) => {
      if (res.error) {
        setError(res.error);
      } else if (res.clientSecret && res.totals) {
        setClientSecret(res.clientSecret);
        setTrustedTotals(res.totals);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="checkout-state">
        <p className="checkout-state-error">{error}</p>
      </div>
    );
  }

  if (!clientSecret || !trustedTotals) {
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
      colorText: "#0f1d3d",
      colorDanger: "#e53e3e",
      fontFamily: "Arial, sans-serif",
      borderRadius: "8px",
    },
  };

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance, loader: "auto" }}>
      <CheckoutForm totals={trustedTotals} />
    </Elements>
  );
}
