"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const legends = [
  {
    id: "messi",
    name: "LIONEL MESSI",
    image: "/messi.jpg",
    desc: "The magician of Barcelona. A cap inspired by the greatest playmaker the world has ever seen.",
    productId: "1",
  },
  {
    id: "neymar",
    name: "NEYMAR JR",
    image: "/yamal.jpg",
    desc: "Flair, skill, and showmanship. A cap that captures the essence of Brazilian brilliance.",
    productId: "2",
  },
  {
    id: "ronaldo",
    name: "CRISTIANO RONALDO",
    image: "/ronaldo.jpg",
    desc: "Relentless ambition and power. A cap forged in the fire of a champion's mentality.",
    productId: "3",
  },
  {
    id: "mbappe",
    name: "MBAPPE",
    image: "/mbappe.jpg",
    desc: "Speed, youth, and the future of football. A cap designed for the next generation of legends.",
    productId: "4",
  },
];

const LegendSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const cards = cardRefs.current.filter(Boolean);

    if (!section || !heading || cards.length === 0) return;

    const ctx = gsap.context(() => {
      // Heading
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

      // Cards slide in from left one by one, reverse out right to left on scroll up
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
          {legends.map((legend, i) => (
            <div
              key={legend.id}
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`legend-card-wrapper ${i % 2 === 0 ? "legend-card--tall" : "legend-card--short"}`}
            >
              <div className="legend-card">
                {/* Front */}
                <div className="legend-card-front">
                  <Image
                    src={legend.image}
                    alt={legend.name}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                </div>

                {/* Back */}
                <div className="legend-card-back">
                  <div className="legend-card-back-top">
                    <Image
                      src="/image2.png"
                      alt="Legacy Cap"
                      fill
                      style={{ objectFit: "contain" }}
                    />
                  </div>
                  <div className="legend-card-back-bottom">
                    <h4>{legend.name}</h4>
                    <p>{legend.desc}</p>
                    <Link
                      href={`/product/${legend.productId}`}
                      className="legend-view-btn"
                    >
                      View Product
                    </Link>
                  </div>
                </div>
              </div>

              <p className="legend-card-label">{legend.name}</p>
            </div>
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
