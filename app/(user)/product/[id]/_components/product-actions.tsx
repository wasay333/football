"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/hooks/cart-context";

type Props = {
  productId: string;
  name: string;
  price: number;
  image: string;
  stock: number;
  allowPreorder: boolean;
};

export default function ProductActions({
  productId,
  name,
  price,
  image,
  stock,
  allowPreorder,
}: Props) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  const available = stock > 0 || allowPreorder;

  const handleAddToCart = () => {
    if (!available) return;
    addToCart({ productId, name, price, image, stock, allowPreorder, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!available) return;
    addToCart({ productId, name, price, image, stock, allowPreorder, quantity: qty });
    router.push("/cart");
  };

  return (
    <div className="pdp-actions">
      {/* Quantity */}
      <div className="pdp-qty">
        <button
          className="pdp-qty-btn"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          disabled={qty <= 1}
        >
          −
        </button>
        <span className="pdp-qty-val">{qty}</span>
        <button
          className="pdp-qty-btn"
          onClick={() => setQty((q) => q + 1)}
          disabled={!available}
        >
          +
        </button>
      </div>

      {/* Buttons */}
      <div className="pdp-btns">
        <button
          className="pdp-btn pdp-btn--cart"
          onClick={handleAddToCart}
          disabled={!available}
        >
          {!available ? "Out of Stock" : added ? "✓ Added!" : "Add to Cart"}
        </button>
        <button
          className="pdp-btn pdp-btn--buy"
          onClick={handleBuyNow}
          disabled={!available}
        >
          {allowPreorder && stock === 0 ? "Pre-order" : "Buy Now"}
        </button>
      </div>

      {allowPreorder && stock === 0 && (
        <p className="pdp-preorder-note">
          Pre-order item. Delivery starts from July 10, 2026.
        </p>
      )}
    </div>
  );
}
