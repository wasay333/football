"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

type Product = {
  id: string;
  name: string;
  price: unknown;
  capImage1: string | null;
  description: string;
  stock?: number;
  allowPreorder?: boolean;
  footballer: { name: string } | null;
};

type Props = {
  products: Product[];
  title?: string;
  highlight?: string;
  badgeText?: string;
  variant?: "default" | "preorder";
};

const BestsellingSection = ({
  products,
  title = "BEST",
  highlight = "SELLING",
  badgeText,
  variant = "default",
}: Props) => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const syncItemsPerPage = () => {
      setItemsPerPage(window.innerWidth <= 768 ? 1 : 3);
    };

    syncItemsPerPage();
    window.addEventListener("resize", syncItemsPerPage);

    return () => window.removeEventListener("resize", syncItemsPerPage);
  }, []);

  const shouldUseCarousel = products.length > 3;
  const pageCount = shouldUseCarousel ? Math.ceil(products.length / itemsPerPage) : 1;
  const safePage = Math.min(page, Math.max(pageCount - 1, 0));
  const visibleProducts = shouldUseCarousel
    ? products.slice(safePage * itemsPerPage, safePage * itemsPerPage + itemsPerPage)
    : products;

  useEffect(() => {
    setPage((current) => Math.min(current, Math.max(pageCount - 1, 0)));
  }, [pageCount]);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const cards = cardRefs.current.filter(Boolean);
    const cleanups: Array<() => void> = [];

    if (!section || !heading || cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        heading,
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, ease: "power3.out",
          scrollTrigger: { trigger: section, start: "top 80%", toggleActions: "play none none reverse" },
        }
      );

      const centerIndex = Math.floor(cards.length / 2);

      gsap.fromTo(
        cards[centerIndex],
        { y: 60, opacity: 0, scale: 0.85 },
        {
          y: 0, opacity: 1, scale: 1, duration: 0.9, ease: "back.out(1.4)",
          scrollTrigger: { trigger: section, start: "top 65%", toggleActions: "play none none reverse" },
        }
      );

      if (cards[0]) {
        gsap.fromTo(
          cards[0],
          { x: -80, opacity: 0, scale: 0.9 },
          {
            x: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 65%", toggleActions: "play none none reverse" },
          }
        );
      }

      if (cards[2]) {
        gsap.fromTo(
          cards[2],
          { x: 80, opacity: 0, scale: 0.9 },
          {
            x: 0, opacity: 1, scale: 1, duration: 0.8, delay: 0.2, ease: "power3.out",
            scrollTrigger: { trigger: section, start: "top 65%", toggleActions: "play none none reverse" },
          }
        );
      }

      cards.forEach((card, i) => {
        if (!card) return;
        const others = cards.filter((_, j) => j !== i);
        const handleMouseEnter = () => {
          gsap.to(card, { scale: i === centerIndex ? 1.12 : 1.06, boxShadow: "0 16px 50px rgba(0,0,0,0.18)", duration: 0.4, ease: "power2.out" });
          gsap.to(others, { scale: 0.92, opacity: 0.5, filter: "blur(2px)", duration: 0.4, ease: "power2.out" });
        };
        const handleMouseLeave = () => {
          gsap.to(card, {
            scale: i === centerIndex ? 1.08 : 1,
            boxShadow: i === centerIndex ? "0 8px 30px rgba(0,0,0,0.1)" : "0 4px 20px rgba(0,0,0,0.06)",
            duration: 0.4, ease: "power2.out",
          });
          gsap.to(others, {
            scale: (j: number) => {
              const otherIndex = cards.indexOf(others[j]);
              return otherIndex === centerIndex ? 1.08 : 1;
            },
            opacity: 1, filter: "blur(0px)", duration: 0.4, ease: "power2.out",
          });
        };

        card.addEventListener("mouseenter", handleMouseEnter);
        card.addEventListener("mouseleave", handleMouseLeave);
        cleanups.push(() => {
          card.removeEventListener("mouseenter", handleMouseEnter);
          card.removeEventListener("mouseleave", handleMouseLeave);
        });
      });
    }, sectionRef);

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      ctx.revert();
    };
  }, [visibleProducts]);

  if (!products.length) return null;

  return (
    <section
      ref={sectionRef}
      className={`bestselling-section ${variant === "preorder" ? "bestselling-section--preorder" : ""}`}
    >
      <div className="bestselling-header-row">
        <h2 ref={headingRef} className="bestselling-heading">
          {title} <span>{highlight}</span>
        </h2>

        {shouldUseCarousel && pageCount > 1 && (
          <div className="bestselling-controls">
            <button
              type="button"
              className="bestselling-control-btn"
              onClick={() => setPage((current) => Math.max(current - 1, 0))}
              disabled={safePage === 0}
              aria-label={`Previous ${title.toLowerCase()} ${highlight.toLowerCase()} products`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="bestselling-controls-count">
              {safePage + 1} / {pageCount}
            </span>
            <button
              type="button"
              className="bestselling-control-btn"
              onClick={() => setPage((current) => Math.min(current + 1, pageCount - 1))}
              disabled={safePage === pageCount - 1}
              aria-label={`Next ${title.toLowerCase()} ${highlight.toLowerCase()} products`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div className="bestselling-cards">
        {visibleProducts.map((item, i) => (
          <Link key={item.id} href={`/product/${item.id}`} className="bestselling-card-link">
            <div
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`bestselling-card ${variant === "preorder" ? "bestselling-card--preorder" : ""} ${i === Math.floor(visibleProducts.length / 2) ? "bestselling-card--center" : ""}`}
            >
              <div className="bestselling-card-image">
                {item.capImage1 && (
                  <Image src={item.capImage1} alt={item.name} fill style={{ objectFit: "cover" }} />
                )}
              </div>
              <div className="bestselling-card-info">
                <div className="bestselling-card-meta">
                  {item.footballer && (
                    <div className="bestselling-card-player">{item.footballer.name.toUpperCase()}</div>
                  )}
                  {badgeText && item.allowPreorder && item.stock === 0 && (
                    <span className="bestselling-card-badge">{badgeText}</span>
                  )}
                </div>
                <h4>{item.name}</h4>
                <p className="bestselling-card-desc">{item.description}</p>
                <div className="bestselling-card-price">${Number(item.price).toFixed(2)}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BestsellingSection;
