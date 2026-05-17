"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

const HeroSection = () => {
  const homeIntroDelaySeconds = 1.4;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // React doesn't reliably set the muted attribute on the DOM element,
    // which causes mobile browsers to block autoplay. Set it directly.
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const tl = gsap.timeline({ delay: homeIntroDelaySeconds });

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

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <section className="hero-section">
      <video
        ref={videoRef}
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        poster="/search-preview.png"
        src="/football1.mp4"
      />
      <div className="hero-overlay" />

      <div className="hero-content">
        <h1 ref={titleRef} className="hero-title" style={{ opacity: 0 }}>
          THE JERSEY
          <span>EVOLVED.</span>
        </h1>
        <p ref={subtitleRef} className="hero-subtitle" style={{ opacity: 0 }}>
          Inspired by the legends, discover our exclusive collection of
          football-inspired headwear crafted for true fans.
        </p>
      </div>
    </section>
  );
};

export default HeroSection;
