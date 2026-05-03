"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type ProductResult = {
  id: string;
  name: string;
  capImage1: string | null;
  price: number;
  footballer: { name: string } | null;
};

type Footballer = {
  id: string;
  name: string;
  profileImage: string | null;
  products: { id: string }[];
};

export default function SearchBar() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [footballers, setFootballers] = useState<Footballer[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const router = useRouter();

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setProducts([]);
  }, []);

  const goToFootballer = useCallback(
    (f: Footballer) => {
      const pid = f.products[0]?.id;
      router.push(pid ? `/product/${pid}` : "/product");
      close();
    },
    [router, close]
  );

  // Load footballers when panel opens
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 50);
    fetch("/api/search")
      .then((r) => r.json())
      .then((data) => setFootballers(data.footballers ?? []));
  }, [open]);

  // Debounced product search
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setProducts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
      const data = await res.json();
      setProducts(data.products ?? []);
      setLoading(false);
    }, 280);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, close]);

  return (
    <>
      {/* Trigger button — used in header */}
      <button
        className="search-trigger"
        onClick={() => setOpen(true)}
        aria-label="Search"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="search-backdrop" onClick={close} />

          {/* Panel */}
          <div className="search-panel">
            {/* Input row */}
            <div className="search-input-row">
              <svg
                className="search-input-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                className="search-input"
                type="text"
                placeholder="Search products…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
              />
              <button className="search-close-btn" onClick={close} aria-label="Close search">
                ✕
              </button>
            </div>

            {/* Results */}
            <div className="search-body">
              {query.trim() ? (
                /* ── Product results ── */
                loading ? (
                  <p className="search-status">Searching…</p>
                ) : products.length > 0 ? (
                  <div className="search-products">
                    {products.map((p) => (
                      <Link
                        key={p.id}
                        href={`/product/${p.id}`}
                        className="search-product-row"
                        onClick={close}
                      >
                        <div className="search-product-thumb">
                          {p.capImage1 && (
                            <Image
                              src={p.capImage1}
                              alt={p.name}
                              fill
                              sizes="48px"
                              style={{ objectFit: "cover" }}
                            />
                          )}
                        </div>
                        <div className="search-product-meta">
                          <span className="search-product-name">{p.name}</span>
                          {p.footballer && (
                            <span className="search-product-player">
                              {p.footballer.name}
                            </span>
                          )}
                        </div>
                        <span className="search-product-price">
                          ${p.price.toFixed(2)}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="search-status">No results for &ldquo;{query}&rdquo;</p>
                )
              ) : (
                /* ── Footballer dropdown ── */
                <>
                  <p className="search-section-label">Browse by Player</p>
                  <div className="search-footballer-grid">
                    {footballers.map((f) => (
                      <button
                        key={f.id}
                        className="search-footballer-btn"
                        onClick={() => goToFootballer(f)}
                      >
                        <div className="search-footballer-avatar">
                          {f.profileImage ? (
                            <Image
                              src={f.profileImage}
                              alt={f.name}
                              fill
                              sizes="44px"
                              style={{ objectFit: "cover", objectPosition: "top" }}
                            />
                          ) : (
                            <span className="search-footballer-initial">
                              {f.name[0]}
                            </span>
                          )}
                        </div>
                        <span className="search-footballer-name">{f.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
