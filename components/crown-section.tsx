"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    num: "01",
    title: "PLAYERS EDITION",
    desc: "Inspired by the mindset, passion, and legacy made for fans who play and live the game.",
    position: "top-left",
  },
  {
    num: "02",
    title: "ADJUSTABLE FIT",
    desc: "Advanced moisture-wicking technology and premium stretch fabric for all-day comfort.",
    position: "bottom-left",
  },
  {
    num: "03",
    title: "SIGNATURE EMBROIDERY",
    desc: "High-definition stitching featuring iconic player emblems and unique legacy details.",
    position: "top-right",
  },
  {
    num: "04",
    title: "BREATHABLE CORE",
    desc: "Laser-cut ventilation ports engineered to keep your head cool under intense pressure.",
    position: "bottom-right",
  },
];

const CrownSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const archRef = useRef<HTMLDivElement>(null);
  const capRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const pointRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mobilePointRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const section = sectionRef.current;
    const arch = archRef.current;
    const cap = capRef.current;
    const heading = headingRef.current;
    const desktopPoints = pointRefs.current.filter(Boolean);
    const mobilePoints = mobilePointRefs.current.filter(Boolean);

    if (!section || !arch || !cap || !heading) return;

    // Scope all animations to this component so cleanup doesn't affect others
    const ctx = gsap.context(() => {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;

      // Heading animation
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

      // Arch scale-in
      gsap.fromTo(
        arch,
        { scale: 0.8, opacity: 0 },
        {
          scale: 1,
          opacity: 1,
          duration: 1,
          ease: "power2.out",
          scrollTrigger: {
            trigger: section,
            start: "top 70%",
            toggleActions: "play none none reverse",
          },
        }
      );

      // Cap float in
      gsap.fromTo(
        cap,
        { y: 80, opacity: 0, rotation: -15 },
        {
          y: 0,
          opacity: 1,
          rotation: 0,
          duration: 1.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 65%",
            toggleActions: "play none none reverse",
          },
        }
      );

      if (isMobile) {
        // Mobile: stacking effect — each point slides up one by one
        mobilePoints.forEach((point) => {
          gsap.set(point, { y: 40, opacity: 0 });

          gsap.to(point, {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: "power3.out",
            scrollTrigger: {
              trigger: point,
              start: "top 90%",
              end: "top 60%",
              toggleActions: "play none none reverse",
            },
          });
        });
      } else {
        // Desktop: slide in from sides
        desktopPoints.forEach((point, i) => {
          const isLeft = i < 2;
          gsap.fromTo(
            point,
            { x: isLeft ? -60 : 60, opacity: 0, scale: 0.7 },
            {
              x: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              delay: i * 0.15,
              ease: "back.out(1.4)",
              scrollTrigger: {
                trigger: section,
                start: "top 55%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });

        // Desktop: continuous floating
        const floatParams = [
          { x: 4, y: -6, rotation: 2, duration: 2.8 },
          { x: -5, y: 5, rotation: -1.5, duration: 3.2 },
          { x: 5, y: -4, rotation: 1.8, duration: 3.0 },
          { x: -4, y: 6, rotation: -2, duration: 2.6 },
        ];

        desktopPoints.forEach((point, i) => {
          const p = floatParams[i];
          gsap.to(point, {
            x: p.x,
            y: p.y,
            rotation: p.rotation,
            duration: p.duration,
            ease: "sine.inOut",
            repeat: -1,
            yoyo: true,
          });
        });

        // Cap subtle float (desktop only)
        gsap.to(cap, {
          y: -10,
          rotation: 3,
          duration: 3.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
      }
    }, sectionRef); // scoped to this section's DOM

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="crown-section">
      <h2 ref={headingRef} className="crown-heading">
        CROWN YOUR <span>GAME</span>
      </h2>

      <div className="crown-layout">
        {/* Desktop: Left features */}
        <div className="crown-features crown-features--left crown-desktop-only">
          {features
            .filter((f) => f.position.includes("left"))
            .map((f, i) => (
              <div
                key={f.num}
                ref={(el) => {
                  pointRefs.current[i === 0 ? 0 : 1] = el;
                }}
                className={`crown-feature crown-feature--${f.position}`}
              >
                <div className="crown-feature-text crown-feature-text--left">
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
                <div className="crown-num">{f.num}</div>
              </div>
            ))}
        </div>

        {/* Center arch with sky + cap */}
        <div ref={archRef} className="crown-arch">
          <div className="crown-arch-sky">
            <Image
              src="/sky.jpeg"
              alt="Sky background"
              fill
              style={{ objectFit: "cover" }}
              priority
            />
          </div>
          <div ref={capRef} className="crown-cap">
            <Image
              src="/image2.png"
              alt="Legacy Cap"
              width={320}
              height={280}
              style={{ objectFit: "contain" }}
              priority
            />
          </div>
        </div>

        {/* Desktop: Right features */}
        <div className="crown-features crown-features--right crown-desktop-only">
          {features
            .filter((f) => f.position.includes("right"))
            .map((f, i) => (
              <div
                key={f.num}
                ref={(el) => {
                  pointRefs.current[i === 0 ? 2 : 3] = el;
                }}
                className={`crown-feature crown-feature--${f.position}`}
              >
                <div className="crown-num">{f.num}</div>
                <div className="crown-feature-text crown-feature-text--right">
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </div>
            ))}
        </div>

        {/* Mobile: All 4 features stacked vertically */}
        <div className="crown-mobile-stack crown-mobile-only">
          {features.map((f, i) => (
            <div
              key={f.num}
              ref={(el) => {
                mobilePointRefs.current[i] = el;
              }}
              className="crown-mobile-card"
            >
              <div className="crown-num">{f.num}</div>
              <div className="crown-mobile-card-text">
                <h4>{f.title}</h4>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CrownSection;
