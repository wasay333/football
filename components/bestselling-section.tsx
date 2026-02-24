"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";

gsap.registerPlugin(ScrollTrigger);

const bestsellers = [
  {
    id: "1",
    player: "LIONEL MESSI",
    name: "GOAT 10 Signature Snapback",
    desc: "Crafted for the faithful — a cap that carries the soul of Barcelona and the magic of Messi.",
    price: "$29.50",
    image: "/image2.png",
  },
  {
    id: "3",
    player: "CRISTIANO RONALDO",
    name: "GOAT 7 Signature Snapback",
    desc: "Built for champions — engineered with the same relentless drive that defines CR7.",
    price: "$29.50",
    image: "/image2.png",
  },
  {
    id: "2",
    player: "NEYMAR",
    name: "GOAT 11 Signature Snapback",
    desc: "Pure Brazilian flair — a cap that moves with style, skill, and showmanship.",
    price: "$29.50",
    image: "/image2.png",
  },
];

const BestsellingSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const heading = headingRef.current;
    const cards = cardRefs.current.filter(Boolean);

    if (!section || !heading || cards.length === 0) return;

    const ctx = gsap.context(() => {
      // Heading: split "BEST" and "SELLING" animate separately
      gsap.fromTo(
        heading,
        { y: 40, opacity: 0 },
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

      // Cards: center card scales up first, then side cards slide in
      const centerIndex = 1;
      // Center card pops up
      gsap.fromTo(
        cards[centerIndex],
        { y: 60, opacity: 0, scale: 0.85 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: "back.out(1.4)",
          scrollTrigger: {
            trigger: section,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Left card slides from left
      gsap.fromTo(
        cards[0],
        { x: -80, opacity: 0, scale: 0.9 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Right card slides from right
      gsap.fromTo(
        cards[2],
        { x: 80, opacity: 0, scale: 0.9 },
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.8,
          delay: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Focus effect: hover one card → scale it up, dim the others
      cards.forEach((card, i) => {
        if (!card) return;
        const others = cards.filter((_, j) => j !== i);

        card.addEventListener("mouseenter", () => {
          gsap.to(card, {
            scale: i === centerIndex ? 1.12 : 1.06,
            boxShadow: "0 16px 50px rgba(0,0,0,0.18)",
            duration: 0.4,
            ease: "power2.out",
          });
          gsap.to(others, {
            scale: 0.92,
            opacity: 0.5,
            filter: "blur(2px)",
            duration: 0.4,
            ease: "power2.out",
          });
        });

        card.addEventListener("mouseleave", () => {
          gsap.to(card, {
            scale: i === centerIndex ? 1.08 : 1,
            boxShadow: i === centerIndex
              ? "0 8px 30px rgba(0,0,0,0.1)"
              : "0 4px 20px rgba(0,0,0,0.06)",
            duration: 0.4,
            ease: "power2.out",
          });
          gsap.to(others, {
            scale: (j: number) => {
              const otherIndex = cards.indexOf(others[j]);
              return otherIndex === centerIndex ? 1.08 : 1;
            },
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.4,
            ease: "power2.out",
          });
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="bestselling-section">
      <h2 ref={headingRef} className="bestselling-heading">
        BEST <span>SELLING</span>
      </h2>

      <div className="bestselling-cards">
        {bestsellers.map((item, i) => (
          <Link
            key={item.id}
            href={`/product/${item.id}`}
            className="bestselling-card-link"
          >
            <div
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className={`bestselling-card ${i === 1 ? "bestselling-card--center" : ""}`}
            >
              <div className="bestselling-card-player">{item.player}</div>
              <div className="bestselling-card-image">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  style={{ objectFit: "contain" }}
                />
              </div>
              <div className="bestselling-card-info">
                <h4>{item.name}</h4>
                <p>{item.desc}</p>
                <div className="bestselling-card-price">{item.price}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default BestsellingSection;
