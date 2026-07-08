"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/cart-context";
import { isUploadedAssetPath } from "@/lib/image";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems } = useCart();

  if (items.length === 0) {
    return (
      <div className="cart-page cart-page--empty">
        <div className="cart-empty">
          <div className="cart-empty-icon">
            <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
          </div>
          <p className="cart-empty-eyebrow">Foocaps</p>
          <h2 className="cart-empty-title">Your cart is empty</h2>
          <p className="cart-empty-sub">Discover our footballer-inspired cap collection and crown your game.</p>
          <Link href="/product" className="cart-empty-btn">Shop the Collection</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      {/* Hero bar */}
      <div className="cart-hero">
        <div className="cart-hero-inner">
          <div>
            <p className="cart-hero-eyebrow">Foocaps</p>
            <h1 className="cart-hero-title">Your Cart</h1>
          </div>
          <span className="cart-hero-count">{totalItems} {totalItems === 1 ? "item" : "items"}</span>
        </div>
      </div>

      <div className="cart-body">
        <div className="cart-items">
          {items.map((item) => (
            <div key={item.productId} className="cart-item">
              <div className="cart-item-img">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="140px"
                  unoptimized={isUploadedAssetPath(item.image)}
                  style={{ objectFit: "contain" }}
                />
              </div>

              <div className="cart-item-body">
                <div className="cart-item-top">
                  <div className="cart-item-meta">
                    <p className="cart-item-name">{item.name}</p>
                    <div className="cart-item-tags">
                      {item.allowPreorder && item.stock === 0 && (
                        <span className="cart-item-preorder">Pre-order</span>
                      )}
                    </div>
                    <p className="cart-item-unit">${item.price.toFixed(2)} each</p>
                  </div>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.productId)}
                    aria-label="Remove"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <div className="cart-item-bottom">
                  <div className="cart-item-qty">
                    <button
                      className="cart-qty-btn"
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >-</button>
                    <span className="cart-qty-val">{item.quantity}</span>
                    <button
                      className="cart-qty-btn"
                      onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    >+</button>
                  </div>
                  <p className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}

          <Link href="/product" className="cart-continue-link">Back to Shopping</Link>
        </div>

        <div className="cart-summary">
          <h2 className="cart-summary-title">Order Summary</h2>

          <div className="cart-summary-rows">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <span>${totalPrice.toFixed(2)}</span>
            </div>
            <div className="cart-summary-row">
              <span>Shipping</span>
              <span className="cart-free">Free</span>
            </div>
          </div>

          <div className="cart-summary-divider" />

          <div className="cart-summary-total">
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>

          <p className="cart-summary-note">
            Free shipping is included on every order.
          </p>

          <Link href="/checkout" className="cart-checkout-btn">
            Proceed to Checkout
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}
