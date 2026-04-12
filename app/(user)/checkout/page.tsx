import CheckoutWrapper from "./_components/checkout-wrapper";

export default function CheckoutPage() {
  return (
    <div className="checkout-page">
      {/* Hero bar */}
      <div className="checkout-hero">
        <div className="checkout-hero-inner">
          <p className="checkout-hero-eyebrow">Foocaps</p>
          <h1 className="checkout-hero-title">Checkout</h1>
        </div>
      </div>

      {/* Body */}
      <div className="checkout-body">
        <CheckoutWrapper />
      </div>
    </div>
  );
}
