"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const AboutSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const imageCardRef = useRef<HTMLDivElement>(null);
  const textCardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Heading animate in
      gsap.fromTo(
        headingRef.current,
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 80%",
          },
        }
      );

      // Cards start stacked, fan out on scroll
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: stackRef.current,
          start: "top 75%",
          end: "top 30%",
          scrub: false,
          toggleActions: "play none none reverse",
        },
      });

      // Image card — rotate slightly and move left
      tl.fromTo(
        imageCardRef.current,
        { rotation: 0, x: 30, scale: 0.95, opacity: 0 },
        {
          rotation: -3,
          x: 0,
          scale: 1,
          opacity: 1,
          duration: 0.8,
          ease: "power3.out",
        }
      );

      // Text card — fan out from behind image to the right
      tl.fromTo(
        textCardRef.current,
        { x: -200, rotation: -8, opacity: 0, scale: 0.9 },
        {
          x: 0,
          rotation: 2,
          opacity: 1,
          scale: 1,
          duration: 0.9,
          ease: "power3.out",
        },
        "-=0.5"
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="about-section" id="about">
      <h2 ref={headingRef} className="about-heading" style={{ opacity: 0 }}>
        ABOUT <span>US</span>
      </h2>

      <div ref={stackRef} className="about-stack">
        {/* Image card */}
        <div ref={imageCardRef} className="about-card about-card--image">
          <Image
            src="/image1.jpeg"
            alt="Football and Foocaps"
            width={480}
            height={360}
            className="about-img"
          />
        </div>

        {/* Text card — fans out on scroll */}
        <div ref={textCardRef} className="about-card about-card--text">
          <h3>The Pitch. Refined.</h3>
          <p>
            We turn the icons of the game into the icons of your wardrobe. At
            Foocaps, we don&apos;t do half-measures. We go deep,
            player-inspired headwear for the fan who values style as much as a
            last-minute goal.
          </p>
          <p>
            Every cap is a tribute to a legend, crafted with premium materials
            to ensure you represent your hero with effortless class.
          </p>
          <div className="about-accent-line" />
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
