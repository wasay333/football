"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useCart } from "@/hooks/cart-context";
import {
  quoteFedExShippingForPaymentIntent,
  updatePaymentIntentCustomerDetails,
  type TrustedTotals,
} from "../_actions/create-payment-intent";

type CheckoutFormProps = {
  paymentIntentId: string;
  totals: TrustedTotals;
  onTotalsChange: (totals: TrustedTotals) => void;
};

export default function CheckoutForm({ paymentIntentId, totals, onTotalsChange }: CheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { items } = useCart();

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [shippingStatus, setShippingStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const { subtotal: totalPrice, discount, discountLabel, shipping, total } = totals;
  const discountPercent = discount > 0 && totalPrice > 0
    ? Math.max(1, Math.round((discount / totalPrice) * 100))
    : 0;

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "GB",
  });
  const requiresState = form.country === "US" || form.country === "CA"
  const resetQuotedShipping = () => {
    onTotalsChange({
      subtotal: totalPrice,
      discount,
      discountLabel,
      shipping: 0,
      total: totalPrice - discount,
    });
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (["address", "city", "state", "postalCode", "country"].includes(field)) {
      if (shipping !== 0) {
        resetQuotedShipping();
      }
      if (shippingStatus === "error") {
        setShippingStatus("idle");
      }
    }
    if (shippingStatus === "ready") {
      setShippingStatus("idle");
    }
  };

  async function handleQuoteShipping() {
    setShippingStatus("loading");
    setErrorMsg("");

    const result = await quoteFedExShippingForPaymentIntent(paymentIntentId, form);
    if (result.error || !result.totals) {
      setErrorMsg(result.error ?? "Unable to confirm your shipping address right now.");
      setShippingStatus("error");
      return;
    }

    onTotalsChange(result.totals);
    setShippingStatus("ready");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (shippingStatus !== "ready") {
      setErrorMsg("Please confirm your shipping address before paying.");
      return;
    }

    setStatus("loading");
    setErrorMsg("");

    const updateResult = await updatePaymentIntentCustomerDetails(paymentIntentId, form);
    if (updateResult.error) {
      setErrorMsg(updateResult.error);
      setStatus("error");
      return;
    }

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMsg(submitError.message ?? "Payment failed");
      setStatus("error");
      return;
    }

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/success`,
      },
    });

    if (error) {
      setErrorMsg(error.message ?? "Payment failed. Please try again.");
      setStatus("error");
    }
    // On success Stripe redirects to /success automatically
  }

  if (!items.length) {
    router.replace("/cart");
    return null;
  }

  return (
    <form className="checkout-layout" onSubmit={handleSubmit}>
      {/* ── Left: customer + payment ── */}
      <div className="checkout-left">
        {/* Contact */}
        <section className="checkout-section">
          <h2 className="checkout-section-title">Contact</h2>
          <div className="checkout-fields">
            <div className="checkout-field checkout-field--full">
              <label>Full name</label>
              <input value={form.name} onChange={set("name")} required placeholder="Lionel Messi" />
            </div>
            <div className="checkout-field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={set("email")} required placeholder="you@example.com" />
            </div>
            <div className="checkout-field">
              <label>Phone (optional)</label>
              <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+44 7700 900000" />
            </div>
          </div>
        </section>

        {/* Shipping address */}
        <section className="checkout-section">
          <h2 className="checkout-section-title">Shipping Address</h2>
          <div className="checkout-fields">
            <div className="checkout-field checkout-field--full">
              <label>Street address</label>
              <input value={form.address} onChange={set("address")} required placeholder="123 Main Street" />
            </div>
            <div className="checkout-field">
              <label>City</label>
              <input
                value={form.city}
                onChange={set("city")}
                required
                placeholder={form.country === "US" ? "Plainsboro" : "London"}
              />
            </div>
            <div className="checkout-field">
              <label>State / Province</label>
              <input
                value={form.state}
                onChange={set("state")}
                required={requiresState}
                placeholder={form.country === "US" ? "NJ" : "Optional"}
                maxLength={32}
              />
            </div>
            <div className="checkout-field">
              <label>Postal code</label>
              <input value={form.postalCode} onChange={set("postalCode")} required placeholder="EC1A 1BB" />
            </div>
            <div className="checkout-field checkout-field--full">
              <label>Country</label>
              <select value={form.country} onChange={set("country")}>
                <option value="PK">Pakistan</option>
                <option value="GB">United Kingdom</option>
                <option value="US">United States</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="ES">Spain</option>
                <option value="IT">Italy</option>
                <option value="NL">Netherlands</option>
                <option value="BE">Belgium</option>
                <option value="PT">Portugal</option>
                <option value="IE">Ireland</option>
                <option value="SE">Sweden</option>
                <option value="NO">Norway</option>
                <option value="DK">Denmark</option>
                <option value="FI">Finland</option>
                <option value="CH">Switzerland</option>
                <option value="AT">Austria</option>
                <option value="PL">Poland</option>
                <option value="AU">Australia</option>
                <option value="CA">Canada</option>
                <option value="AE">UAE</option>
                <option value="NG">Nigeria</option>
                <option value="GH">Ghana</option>
                <option value="ZA">South Africa</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="checkout-pay-btn"
              onClick={handleQuoteShipping}
              disabled={shippingStatus === "loading" || status === "loading"}
            >
              {shippingStatus === "loading" ? (
                <span className="checkout-spinner" />
              ) : (
                "Confirm Address"
              )}
            </button>
            <p className="checkout-secure-note">
              {shippingStatus === "ready"
                ? `Your address is confirmed and shipping is $${shipping.toFixed(2)} for this order.`
                : "Confirm your address to calculate shipping before paying."}
            </p>
          </div>
          {shippingStatus === "error" && errorMsg && <p className="checkout-error">{errorMsg}</p>}
        </section>

        {/* Payment */}
        <section className="checkout-section">
          <h2 className="checkout-section-title">Payment</h2>
          <p className="checkout-secure-note">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>
            Secured by Stripe — 256-bit SSL encryption
          </p>
          <div className="checkout-stripe-element">
            <PaymentElement
              options={{
                layout: "tabs",
                wallets: { applePay: "auto", googlePay: "auto" },
              }}
            />
          </div>
        </section>

        {errorMsg && shippingStatus !== "error" && <p className="checkout-error">{errorMsg}</p>}

        <button
          type="submit"
          className="checkout-pay-btn"
          disabled={!stripe || status === "loading" || shippingStatus !== "ready"}
        >
          {status === "loading" ? (
            <span className="checkout-spinner" />
          ) : (
            <>
              Pay ${total.toFixed(2)}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
      </div>

      {/* ── Right: order summary ── */}
      <div className="checkout-summary">
        <h2 className="checkout-summary-title">Order Summary</h2>
        <div className="checkout-summary-items">
          {items.map((item) => (
            <div key={item.productId} className="checkout-summary-item">
              <div className="checkout-summary-item-img">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.image} alt={item.name} />
                <span className="checkout-summary-item-qty">{item.quantity}</span>
              </div>
              <div className="checkout-summary-item-info">
                <p className="checkout-summary-item-name">{item.name}</p>
              </div>
              <p className="checkout-summary-item-price">${(item.price * item.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="checkout-summary-rows">
          <div className="checkout-summary-row">
            <span>Subtotal</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
          {discount !== 0 && (
            <div className="checkout-summary-row">
              <span>{discountLabel || "Price Rule"}</span>
              <span>
                {discount > 0
                  ? `-$${discount.toFixed(2)} (${discountPercent}% off)`
                  : `+$${Math.abs(discount).toFixed(2)}`}
              </span>
            </div>
          )}
          <div className="checkout-summary-row">
            <span>Shipping</span>
            <span>
              {shippingStatus === "ready"
                ? `$${shipping.toFixed(2)}`
                : "Confirm address"}
            </span>
          </div>
          <div className="checkout-summary-divider" />
          <div className="checkout-summary-total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </form>
  );
}
