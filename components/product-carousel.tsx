"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

type Product = {
  id: string;
  name: string;
  price: number;
  mannequinImage: string | null;
  footballer: { name: string } | null;
  category: { name: string } | null;
  stock: number;
  allowPreorder: boolean;
};

type Props = {
  products: Product[];
  title: string;
  highlight?: string;
  variant?: "default" | "preorder";
};

const SWIPE_THRESHOLD = 50;

export default function ProductCarousel({
  products,
  title,
  highlight,
  variant = "default",
}: Props) {
  const [page, setPage] = useState(0);
  const [step, setStep] = useState(3);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDraggingH = useRef(false);

  useEffect(() => {
    const update = () => {
      setStep(window.innerWidth <= 768 ? 1 : 3);
      setPage(0);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const pageCount = Math.ceil(products.length / step);

  const applyTransform = useCallback((offsetPx: number, animate: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    el.style.transition = animate ? "transform 0.35s ease" : "none";
    el.style.transform = `translateX(calc(${-page * 100}% + ${offsetPx}px))`;
  }, [page]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDraggingH.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isDraggingH.current) {
      if (Math.abs(dy) > Math.abs(dx)) return;
      isDraggingH.current = true;
    }

    e.preventDefault();
    applyTransform(dx, false);
  }, [applyTransform]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!isDraggingH.current) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;

    let nextPage = page;
    if (dx < -SWIPE_THRESHOLD) nextPage = Math.min(page + 1, pageCount - 1);
    else if (dx > SWIPE_THRESHOLD) nextPage = Math.max(page - 1, 0);

    if (nextPage !== page) {
      setPage(nextPage);
    } else {
      applyTransform(0, true);
    }

    isDraggingH.current = false;
  }, [page, pageCount, applyTransform]);

  // Keep track transform in sync when page changes via buttons
  useEffect(() => {
    applyTransform(0, true);
  }, [page, applyTransform]);

  if (!products.length) return null;

  return (
    <section className={`psc-section${variant === "preorder" ? " psc-section--preorder" : ""}`}>
      {/* Left: title + controls */}
      <div className="psc-left">
        <h2 className="psc-title">
          {title}
          {highlight && <><br /><span>{highlight}</span></>}
        </h2>
        {pageCount > 1 && (
          <div className="psc-controls">
            <button
              className="psc-btn"
              onClick={() => setPage((p) => Math.max(p - 1, 0))}
              disabled={page === 0}
              aria-label="Previous"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              className="psc-btn"
              onClick={() => setPage((p) => Math.min(p + 1, pageCount - 1))}
              disabled={page === pageCount - 1}
              aria-label="Next"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Right: sliding carousel */}
      <div className="psc-right">
        <div
          className="psc-overflow"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div ref={trackRef} className="psc-track">
            {products.map((product) => {
              const inStock = product.stock > 0 || product.allowPreorder;
              const ctaLabel = variant === "preorder" ? "Pre-order" : "Shop Now";
              return (
                <Link key={product.id} href={`/product/${product.id}`} className="psc-card">
                  <div className="psc-card-img">
                    {product.mannequinImage && (
                      <Image
                        src={product.mannequinImage}
                        alt={product.name}
                        fill
                        unoptimized
                        style={{ objectFit: "cover", objectPosition: "center center" }}
                      />
                    )}
                    <div className="psc-card-badges">
                      {!inStock && variant !== "preorder" && (
                        <span className="psc-badge psc-badge--sold">Sold Out</span>
                      )}
                    </div>
                  </div>
                  <div className="psc-card-info">
                    {product.footballer && (
                      <span className="psc-card-player">{product.footballer.name}</span>
                    )}
                    <h3 className="psc-card-name">{product.name}</h3>
                    <div className="psc-card-purchase">
                      <span className="psc-card-price">${product.price.toFixed(2)}</span>
                      <span className="psc-card-cta">{ctaLabel}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Dot indicators — visible on mobile */}
        {pageCount > 1 && (
          <div className="psc-dots">
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                className={`psc-dot${i === page ? " psc-dot--active" : ""}`}
                onClick={() => setPage(i)}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
