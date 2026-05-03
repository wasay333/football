"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";

export default function ShopHero() {
  const gridRef = useRef<HTMLDivElement>(null);
  const cellRefs = useRef<(HTMLDivElement | null)[]>([]);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        textRef.current,
        { y: 36, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: "power3.out", delay: 0.15 }
      );

      cellRefs.current.forEach((cell, i) => {
        if (!cell) return;
        gsap.fromTo(
          cell,
          { opacity: 0, scale: 0.94, y: 24 },
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 0.75,
            delay: 0.1 + i * 0.12,
            ease: "power3.out",
          }
        );
      });
    }, gridRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={gridRef} className="sh-grid">
      {/* Left — large hero image */}
      <div
        ref={(el) => { cellRefs.current[0] = el; }}
        className="sh-cell sh-cell--main"
      >
        <Image
          src="/produc1.jpeg"
          alt="Foocaps Collection"
          fill
          sizes="(max-width: 768px) 100vw, 58vw"
          style={{ objectFit: "cover", objectPosition: "center 20%" }}
          priority
        />
        <div className="sh-overlay sh-overlay--main" />
        <div ref={textRef} className="sh-content sh-content--main">
          <span className="sh-eyebrow">FIFA World Cup 2026</span>
          <h1 className="sh-title">
            The
            <br />
            <em>Collection.</em>
          </h1>
          <p className="sh-sub">Player-inspired headwear for every nation.</p>
        </div>
      </div>

      {/* Top right */}
      <div
        ref={(el) => { cellRefs.current[1] = el; }}
        className="sh-cell sh-cell--a"
      >
        <Image
          src="/produc2.jpeg"
          alt="Foocaps Cap"
          fill
          sizes="(max-width: 768px) 100vw, 42vw"
          style={{ objectFit: "cover", objectPosition: "center 15%" }}
        />
        <div className="sh-overlay sh-overlay--top" />
        <div className="sh-content sh-content--top">
          <span className="sh-pill">Nations Edition</span>
          <p className="sh-phrase">
            Rep Your
            <br />
            <em>Nation.</em>
          </p>
        </div>
      </div>

      {/* Bottom right */}
      <div
        ref={(el) => { cellRefs.current[2] = el; }}
        className="sh-cell sh-cell--b"
      >
        <Image
          src="/produc3.jpeg"
          alt="Foocaps Limited Edition"
          fill
          sizes="(max-width: 768px) 100vw, 42vw"
          style={{ objectFit: "cover", objectPosition: "center 15%" }}
        />
        <div className="sh-overlay sh-overlay--bottom" />
        <div className="sh-content sh-content--bottom">
          <p className="sh-phrase sh-phrase--right">
            Limited
            <br />
            <em>Edition.</em>
          </p>
          <span className="sh-pill">WC26</span>
        </div>
      </div>
    </div>
  );
}
