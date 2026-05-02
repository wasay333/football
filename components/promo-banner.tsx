"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const PromoBanner = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        contentRef.current,
        { x: -48, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 78%",
            toggleActions: "play none none reverse",
          },
        }
      );

      cardRefs.current.forEach((card, i) => {
        if (!card) return;
        gsap.fromTo(
          card,
          { y: 48, opacity: 0, scale: 0.86 },
          {
            y: 0,
            opacity: 1,
            scale: 1,
            duration: 0.75,
            delay: 0.18 + i * 0.14,
            ease: "back.out(1.4)",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 78%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="promo-section" id="about">
    <section ref={sectionRef} className="promo-banner">
      {/* Left: content */}
      <div ref={contentRef} className="promo-content">
        <span className="promo-eyebrow">FIFA World Cup 2026 · Limited Edition</span>
        <h2 className="promo-heading">
          Rep Your Nation.
          <br />
          Own The <em>Cup.</em>
        </h2>
        <p className="promo-sub">
          Celebrate the greatest tournament on earth. Iconic
          player-inspired caps for every nation — crafted for
          true fans of the beautiful game.
        </p>
        <Link href="/product" className="promo-cta">
          Shop The Collection →
        </Link>
      </div>

      {/* Right: layered cap cards */}
      <div className="promo-images">
        {/* Back-left card — Argentina blue */}
        <div
          ref={(el) => {
            cardRefs.current[0] = el;
          }}
          className="promo-cap-card promo-cap-card--left"
        >
          <div className="promo-cap-img">
            <Image
              src="/rem2.png"
              alt="Argentina Edition Cap"
              fill
              sizes="(max-width: 480px) 130px, (max-width: 768px) 120px, 165px"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Front-center card — Portugal red */}
        <div
          ref={(el) => {
            cardRefs.current[1] = el;
          }}
          className="promo-cap-card promo-cap-card--center"
        >
          <div className="promo-cap-img promo-cap-img--lg">
            <Image
              src="/rem1.png"
              alt="Portugal Edition Cap"
              fill
              sizes="(max-width: 480px) 160px, (max-width: 768px) 148px, 200px"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>

        {/* Back-right card — England white */}
        <div
          ref={(el) => {
            cardRefs.current[2] = el;
          }}
          className="promo-cap-card promo-cap-card--right"
        >
          <div className="promo-cap-img">
            <Image
              src="/rem3.png"
              alt="England Edition Cap"
              fill
              sizes="(max-width: 480px) 130px, (max-width: 768px) 120px, 165px"
              style={{ objectFit: "contain" }}
            />
          </div>
        </div>
      </div>
    </section>
    </div>
  );
};

export default PromoBanner;
