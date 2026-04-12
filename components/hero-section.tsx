"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const HeroSection = () => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const taglineRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const tl = gsap.timeline({ delay: 3.8 });

    tl.fromTo(
      titleRef.current,
      { y: 60, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" }
    );

    tl.fromTo(
      subtitleRef.current,
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    );

    tl.fromTo(
      taglineRef.current,
      { y: 20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" },
      "-=0.3"
    );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="hero-section">
      <video
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        src="/football1.mp4"
      />
      <div className="hero-overlay" />

      <div className="hero-content">
        <h1 ref={titleRef} className="hero-title" style={{ opacity: 0 }}>
          WEAR THE
          <span>LEGACY.</span>
        </h1>
        <p ref={subtitleRef} className="hero-subtitle" style={{ opacity: 0 }}>
          Inspired by the legends, discover our exclusive collection of
          football-inspired headwear crafted for true fans.
        </p>
        <p ref={taglineRef} className="hero-tagline" style={{ opacity: 0 }}>
          Set Your Head in the Game. Literally.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
