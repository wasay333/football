"use client";

import { useState, useEffect } from "react";
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

export default function ProductCarousel({
  products,
  title,
  highlight,
  variant = "default",
}: Props) {
  const [page, setPage] = useState(0);
  const [step, setStep] = useState(3);

  useEffect(() => {
    const update = () => {
      setStep(window.innerWidth <= 768 ? 1 : 3);
      setPage(0);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const STEP = step;
  const pageCount = Math.ceil(products.length / STEP);

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
        <div className="psc-overflow">
          <div
            className="psc-track"
            style={{ transform: `translateX(${-page * 100}%)` }}
          >
            {products.map((product) => {
              const inStock = product.stock > 0 || product.allowPreorder;
              return (
                <Link key={product.id} href={`/product/${product.id}`} className="psc-card">
                  <div className="psc-card-img">
                    {product.mannequinImage && (
                      <Image
                        src={product.mannequinImage}
                        alt={product.name}
                        fill
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
                    <span className="psc-card-price">${product.price.toFixed(2)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
