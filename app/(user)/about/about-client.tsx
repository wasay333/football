"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const values = [
  {
    number: "01",
    title: "Quality First",
    body: "Premium materials, precise stitching, and a fit that lasts — every cap is built to the same standard we hold our football heroes to.",
  },
  {
    number: "02",
    title: "Fan-Led Design",
    body: "Our designs come straight from the terrace. Real fans, real passion, real style — no boardroom, no compromise.",
  },
  {
    number: "03",
    title: "Iconic Tributes",
    body: "Every cap tells a story. From golden boots to iconic shirts, we capture the essence of football's greatest moments.",
  },
];

const stats = [
  { value: "500+", label: "Caps Sold" },
  { value: "20+", label: "Footballer Tributes" },
  { value: "100%", label: "Fan Approved" },
  { value: "2024", label: "Founded" },
];

export default function AboutPageClient() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const heroSubRef = useRef<HTMLParagraphElement>(null);
  const storyRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);
  const valuesRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Hero entrance
    const tl = gsap.timeline({ delay: 0.2 });
    tl.fromTo(
      heroTitleRef.current,
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }
    ).fromTo(
      heroSubRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    );

    // Story section
    const storyEls = storyRef.current?.querySelectorAll(".ap-story-el");
    if (storyEls) {
      gsap.fromTo(
        storyEls,
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: storyRef.current,
            start: "top 80%",
          },
        }
      );
    }

    // Stats counter
    const statEls = statsRef.current?.querySelectorAll(".ap-stat");
    if (statEls) {
      gsap.fromTo(
        statEls,
        { y: 40, opacity: 0, scale: 0.9 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: "back.out(1.7)",
          scrollTrigger: {
            trigger: statsRef.current,
            start: "top 80%",
          },
        }
      );
    }

    // Value cards
    const cards = valuesRef.current?.querySelectorAll(".ap-value-card");
    if (cards) {
      gsap.fromTo(
        cards,
        { x: -40, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: valuesRef.current,
            start: "top 80%",
          },
        }
      );
    }

    // CTA
    gsap.fromTo(
      ctaRef.current,
      { y: 40, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 85%",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <div className="ap-page">
      {/* ── Hero ── */}
      <div ref={heroRef} className="ap-hero">
        <div className="ap-hero-inner">
          <span className="ap-eyebrow">Our Story</span>
          <h1 ref={heroTitleRef} className="ap-hero-title" style={{ opacity: 0 }}>
            BORN FROM<br />
            <span>THE BEAUTIFUL GAME</span>
          </h1>
          <p ref={heroSubRef} className="ap-hero-sub" style={{ opacity: 0 }}>
            Foocaps was founded by fans, for fans. Every cap in our collection
            pays tribute to the footballers who defined generations.
          </p>
        </div>
        <div className="ap-hero-scroll">
          <span>scroll</span>
          <div className="ap-hero-scroll-line" />
        </div>
      </div>

      {/* ── Story ── */}
      <section ref={storyRef} className="ap-story">
        <div className="ap-story-grid">
          <div className="ap-story-el ap-story-label">
            <span>WHO WE ARE</span>
          </div>
          <h2 className="ap-story-el ap-story-heading">
            The Pitch.<br /><span>Refined.</span>
          </h2>
          <div className="ap-story-el ap-story-divider" />
          <p className="ap-story-el ap-story-body">
            We turn the icons of the game into the icons of your wardrobe.
            At Foocaps, we don&apos;t do half-measures. Player-inspired headwear
            for the fan who values style as much as a last-minute winner.
          </p>
          <p className="ap-story-el ap-story-body">
            Every cap is a tribute to a legend — crafted with premium materials
            to ensure you represent your hero with effortless class, whether
            you&apos;re on the terrace or the street.
          </p>
        </div>
      </section>

      {/* ── Stats ── */}
      <section ref={statsRef} className="ap-stats">
        <div className="ap-stats-grid">
          {stats.map((s) => (
            <div key={s.label} className="ap-stat">
              <span className="ap-stat-value">{s.value}</span>
              <span className="ap-stat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Mission ── */}
      <section className="ap-mission">
        <div className="ap-mission-inner">
          <div className="ap-mission-tag">OUR MISSION</div>
          <blockquote className="ap-mission-quote">
            &ldquo;Football is more than a sport — it&apos;s a culture, a language,
            and a legacy. Our caps let you carry that legacy wherever you go.&rdquo;
          </blockquote>
        </div>
      </section>

      {/* ── Values ── */}
      <section ref={valuesRef} className="ap-values">
        <div className="ap-values-header">
          <span className="ap-eyebrow">What We Stand For</span>
          <h2 className="ap-values-title">OUR VALUES</h2>
        </div>
        <div className="ap-values-list">
          {values.map((v) => (
            <div key={v.number} className="ap-value-card">
              <span className="ap-value-number">{v.number}</span>
              <div className="ap-value-content">
                <h3 className="ap-value-title">{v.title}</h3>
                <p className="ap-value-body">{v.body}</p>
              </div>
              <div className="ap-value-line" />
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section ref={ctaRef} className="ap-cta">
        <div className="ap-cta-inner">
          <h2 className="ap-cta-title">
            READY TO WEAR<br /><span>THE LEGACY?</span>
          </h2>
          <p className="ap-cta-sub">
            Explore our full collection of footballer-inspired caps.
          </p>
          <Link href="/product" className="ap-cta-btn">
            Shop the Collection
          </Link>
        </div>
      </section>
    </div>
  );
}
