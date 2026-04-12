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
  sizes: string[];
};

export default function ProductActions({
  productId,
  name,
  price,
  image,
  stock,
  allowPreorder,
  sizes,
}: Props) {
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState<string | undefined>(undefined);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const router = useRouter();

  const available = stock > 0 || allowPreorder;
  const needsSize = sizes.length > 0 && !size;

  const handleAddToCart = () => {
    if (!available || needsSize) return;
    addToCart({ productId, name, price, image, size, stock, allowPreorder, quantity: qty });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!available || needsSize) return;
    addToCart({ productId, name, price, image, size, stock, allowPreorder, quantity: qty });
    router.push("/cart");
  };

  return (
    <div className="pdp-actions">
      {/* Size selector */}
      {sizes.length > 0 && (
        <div className="pdp-sizes">
          <p className="pdp-sizes-label">
            Size {size && <span className="pdp-sizes-selected">— {size}</span>}
          </p>
          <div className="pdp-sizes-grid">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                className={`pdp-size-btn${size === s ? " pdp-size-btn--active" : ""}`}
                onClick={() => setSize(s)}
              >
                {s}
              </button>
            ))}
          </div>
          {needsSize && <p className="pdp-sizes-hint">Please select a size to continue</p>}
        </div>
      )}

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
          disabled={!available || needsSize}
        >
          {!available ? "Out of Stock" : added ? "✓ Added!" : "Add to Cart"}
        </button>
        <button
          className="pdp-btn pdp-btn--buy"
          onClick={handleBuyNow}
          disabled={!available || needsSize}
        >
          {allowPreorder && stock === 0 ? "Pre-order" : "Buy Now"}
        </button>
      </div>

      {allowPreorder && stock === 0 && (
        <p className="pdp-preorder-note">
          This item is available for pre-order. Ships when in stock.
        </p>
      )}
    </div>
  );
}
