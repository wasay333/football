"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import { isUploadedAssetPath } from "@/lib/image";

gsap.registerPlugin(ScrollTrigger);

const CATCHPHRASES: { key: string; phrase: string }[] = [
  { key: "messi",   phrase: "La Pulga's Finale: World Cup '26 Edition" },
  { key: "ronaldo", phrase: "The Sui Strike: World Cup '26 Edition" },
  { key: "mbapp",   phrase: "Turtle Power: World Cup '26 Edition" },
  { key: "yamal",   phrase: "The Starboy's Debut: World Cup '26 Edition" },
  { key: "lamine",  phrase: "The Starboy's Debut: World Cup '26 Edition" },
  { key: "pulisic", phrase: "Captain America's Charge: World Cup '26 Edition" },
  { key: "kane",    phrase: "Hurricane Force: World Cup '26 Edition" },
];

function getCatchphrase(name: string): string {
  const lower = name.toLowerCase();
  const match = CATCHPHRASES.find(({ key }) => lower.includes(key));
  return match ? match.phrase : name;
}

export type LegendFootballer = {
  id: string;
  name: string;
  profileImage: string | null;
  bio: string | null;
  products: { id: string; mannequinImage: string | null }[];
};

const LegendSection = ({ footballers }: { footballers: LegendFootballer[] }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const cards = cardRefs.current.filter(Boolean);

    if (!section || !heading || cards.length === 0) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        heading,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 80%",
            toggleActions: "play none none reverse",
          },
        }
      );

      cards.forEach((card, i) => {
        gsap.fromTo(
          card,
          { x: -100, opacity: 0, scale: 0.85 },
          {
            x: 0,
            opacity: 1,
            scale: 1,
            duration: 0.8,
            delay: i * 0.2,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 60%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="legend-section">
      <h2 ref={headingRef} className="legend-heading">
        YOUR LEGEND <span>YOUR CAP</span>
      </h2>

      <div className="legend-content">
        <div className="legend-cards">
          {footballers.map((footballer, i) => (
            <Link
              key={footballer.id}
              href={footballer.products[0]?.id ? `/product/${footballer.products[0].id}` : "/product"}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`legend-card-wrapper ${i % 2 === 0 ? "legend-card--tall" : "legend-card--short"}`}
            >
              <div className="legend-card">
                {/* Front */}
                <div className="legend-card-front">
                  <Image
                    src={footballer.profileImage ?? "/image2.png"}
                    alt={footballer.name}
                    fill
                    unoptimized={isUploadedAssetPath(footballer.profileImage)}
                    style={{ objectFit: "cover", objectPosition: "center center" }}
                  />
                </div>

                {/* Back */}
                <div className="legend-card-back">
                  <Image
                    src={footballer.products[0]?.mannequinImage ?? "/image2.png"}
                    alt={`${footballer.name} cap`}
                    fill
                    unoptimized={isUploadedAssetPath(footballer.products[0]?.mannequinImage)}
                    style={{ objectFit: "cover", objectPosition: "center center" }}
                  />
                  <span className="legend-buy-now">Buy Now</span>
                </div>
              </div>

              <p className="legend-card-label">{getCatchphrase(footballer.name)}</p>
            </Link>
          ))}
        </div>

        <div className="legend-explore-wrapper">
          <Link href="/product" className="legend-explore-btn">
            <span>Explore More</span>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default LegendSection;
