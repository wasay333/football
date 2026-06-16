"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  startTransition,
  ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  allowPreorder: boolean;
};

type CartContextType = {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, newQty: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextType | null>(null);

function itemKey(productId: string) {
  return productId;
}

function normalizeCartItems(items: CartItem[]) {
  const merged = new Map<string, CartItem>();

  for (const item of items) {
    const key = itemKey(item.productId);
    const existing = merged.get(key);

    if (existing) {
      merged.set(key, {
        ...existing,
        quantity: existing.quantity + item.quantity,
      });
      continue;
    }

    merged.set(key, {
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: item.quantity,
      stock: item.stock,
      allowPreorder: item.allowPreorder,
    });
  }

  return Array.from(merged.values());
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    let nextItems: CartItem[] | null = null;

    try {
      const stored = localStorage.getItem("lc_cart");
      if (stored) {
        nextItems = normalizeCartItems(JSON.parse(stored) as CartItem[]);
      }
    } catch {}

    startTransition(() => {
      if (nextItems) {
        setItems(nextItems);
      }
      setHydrated(true);
    });
  }, []);

  // Persist to localStorage whenever items change (after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem("lc_cart", JSON.stringify(items));
    }
  }, [items, hydrated]);

  const addToCart = useCallback(
    (item: Omit<CartItem, "quantity"> & { quantity?: number }) => {
      const qty = item.quantity ?? 1;
      const key = itemKey(item.productId);
      setItems((prev) => {
        const existing = prev.find((i) => itemKey(i.productId) === key);
        if (existing) {
          return prev.map((i) =>
            itemKey(i.productId) === key
              ? { ...i, quantity: i.quantity + qty }
              : i
          );
        }
        return [...prev, { ...item, quantity: qty }];
      });
    },
    []
  );

  const removeFromCart = useCallback((productId: string) => {
    const key = itemKey(productId);
    setItems((prev) => prev.filter((i) => itemKey(i.productId) !== key));
  }, []);

  const updateQuantity = useCallback(
    (productId: string, newQty: number) => {
      if (newQty < 1) return;
      const key = itemKey(productId);
      setItems((prev) =>
        prev.map((i) =>
          itemKey(i.productId) === key ? { ...i, quantity: newQty } : i
        )
      );
    },
    []
  );

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
//goose
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
