"use client";

import { useEffect, useRef } from "react";
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
  footballer: { name: string } | null;
};

const BestsellingSection = ({ products }: { products: Product[] }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const cards = cardRefs.current.filter(Boolean);

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

        card.addEventListener("mouseenter", () => {
          gsap.to(card, { scale: i === centerIndex ? 1.12 : 1.06, boxShadow: "0 16px 50px rgba(0,0,0,0.18)", duration: 0.4, ease: "power2.out" });
          gsap.to(others, { scale: 0.92, opacity: 0.5, filter: "blur(2px)", duration: 0.4, ease: "power2.out" });
        });

        card.addEventListener("mouseleave", () => {
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
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  if (!products.length) return null;

  return (
    <section ref={sectionRef} className="bestselling-section">
      <h2 ref={headingRef} className="bestselling-heading">
        BEST <span>SELLING</span>
      </h2>

      <div className="bestselling-cards">
        {products.map((item, i) => (
          <Link key={item.id} href={`/product/${item.id}`} className="bestselling-card-link">
            <div
              ref={(el) => { cardRefs.current[i] = el; }}
              className={`bestselling-card ${i === Math.floor(products.length / 2) ? "bestselling-card--center" : ""}`}
            >
              {item.footballer && (
                <div className="bestselling-card-player">{item.footballer.name.toUpperCase()}</div>
              )}
              <div className="bestselling-card-image">
                {item.capImage1 && (
                  <Image src={item.capImage1} alt={item.name} fill style={{ objectFit: "contain" }} />
                )}
              </div>
              <div className="bestselling-card-info">
                <h4>{item.name}</h4>
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
