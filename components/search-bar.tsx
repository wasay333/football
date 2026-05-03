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
  const wrapRef = useRef<HTMLDivElement>(null);
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

  // Focus input when opened
  useEffect(() => {
    if (!open) return;
    setTimeout(() => inputRef.current?.focus(), 30);
    if (footballers.length === 0) {
      fetch("/api/search")
        .then((r) => r.json())
        .then((data) => setFootballers(data.footballers ?? []));
    }
  }, [open, footballers.length]);

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

  // Close on Escape or outside click
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open, close]);

  const showDropdown = open && (query.trim() ? true : footballers.length > 0);

  return (
    <div ref={wrapRef} className={`search-wrap ${open ? "search-wrap--open" : ""}`}>
      {/* Icon button — hidden when open */}
      {!open && (
        <button
          className="search-trigger"
          onClick={() => setOpen(true)}
          aria-label="Search"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
        </button>
      )}

      {/* Expanded input */}
      {open && (
        <div className="search-field">
          <svg className="search-field-icon" width="15" height="15" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            ref={inputRef}
            className="search-field-input"
            type="text"
            placeholder="Search products…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button className="search-field-close" onClick={close} aria-label="Close">✕</button>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="search-dropdown">
          {query.trim() ? (
            loading ? (
              <p className="search-drop-status">Searching…</p>
            ) : products.length > 0 ? (
              products.map((p) => (
                <Link key={p.id} href={`/product/${p.id}`} className="search-drop-row" onClick={close}>
                  <div className="search-drop-thumb">
                    {p.capImage1 && (
                      <Image src={p.capImage1} alt={p.name} fill sizes="40px"
                        style={{ objectFit: "cover" }} />
                    )}
                  </div>
                  <div className="search-drop-meta">
                    <span className="search-drop-name">{p.name}</span>
                    {p.footballer && <span className="search-drop-player">{p.footballer.name}</span>}
                  </div>
                  <span className="search-drop-price">${p.price.toFixed(2)}</span>
                </Link>
              ))
            ) : (
              <p className="search-drop-status">No results for &ldquo;{query}&rdquo;</p>
            )
          ) : (
            <>
              <p className="search-drop-label">Browse by Player</p>
              <div className="search-drop-players">
                {footballers.map((f) => (
                  <button key={f.id} className="search-drop-player-btn" onClick={() => goToFootballer(f)}>
                    <div className="search-drop-avatar">
                      {f.profileImage ? (
                        <Image src={f.profileImage} alt={f.name} fill sizes="36px"
                          style={{ objectFit: "cover", objectPosition: "top" }} />
                      ) : (
                        <span>{f.name[0]}</span>
                      )}
                    </div>
                    <span>{f.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
