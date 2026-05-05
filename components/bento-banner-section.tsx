"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const BentoBannerSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      cellRefs.current.forEach((cell, i) => {
        if (!cell) return;
        gsap.fromTo(
          cell,
          { opacity: 0, y: 28, scale: 0.96 },
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            delay: i * 0.12,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bento-section">
      <div className="bento-grid">
        {/* Hero — left column, spans both rows */}
        <div
          ref={(el) => {
            cellRefs.current[0] = el;
          }}
          className="bento-cell bento-cell--hero"
        >
          <Image
            src="/banner1.jpg"
            alt="Foocaps Legacy Cap"
            fill
            sizes="(max-width: 480px) 58vw, (max-width: 768px) 56vw, 50vw"
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
          <div className="bento-overlay bento-overlay--hero" />
          <div className="bento-content bento-content--hero-bottom">
            <span className="bento-pill">FIFA World Cup 2026</span>
            <h2 className="bento-hero-heading">
              The
              <br />
              World
              <br />
              <em>Cup Edition.</em>
            </h2>
            <p className="bento-hero-sub">Official WC2026 Collection</p>
            <Link href="/product" className="bento-hero-cta">
              Shop Now →
            </Link>
          </div>
        </div>

        {/* Banner 2 — top right */}
        <div
          ref={(el) => {
            cellRefs.current[1] = el;
          }}
          className="bento-cell bento-cell--img-a"
        >
          <Image
            src="/banner2.jpeg"
            alt="Foocaps – The Squad"
            fill
            sizes="(max-width: 480px) 42vw, (max-width: 768px) 44vw, 35vw"
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
          <div className="bento-overlay bento-overlay--top" />
          <div className="bento-content bento-content--top-left">
            <span className="bento-pill bento-pill--ghost">Nations Edition</span>
            <p className="bento-phrase">
              Represent
              <br />
              <em>Your Nation.</em>
            </p>
          </div>
        </div>

        {/* Banner 3 — bottom right */}
        <div
          ref={(el) => {
            cellRefs.current[2] = el;
          }}
          className="bento-cell bento-cell--img-b"
        >
          <Image
            src="/banner3.jpeg"
            alt="Foocaps – Own The Game"
            fill
            sizes="(max-width: 480px) 42vw, (max-width: 768px) 44vw, 35vw"
            style={{ objectFit: "cover", objectPosition: "center top" }}
          />
          <div className="bento-overlay bento-overlay--bottom" />
          <div className="bento-content bento-content--bottom-right">
            <p className="bento-phrase bento-phrase--right">
              The World
              <br />
              <em>Stage.</em>
            </p>
            <span className="bento-pill bento-pill--ghost">48 Nations</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BentoBannerSection;
