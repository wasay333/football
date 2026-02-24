"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const Loader = () => {
  const [visible, setVisible] = useState(true);
  const textRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const overlayTopRef = useRef<HTMLDivElement>(null);
  const overlayBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();

    tl.fromTo(
      textRef.current,
      { opacity: 0, y: 30, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
    );

    tl.to(
      progressRef.current,
      {
        width: "100%",
        duration: 2,
        ease: "power2.inOut",
        onUpdate: function () {
          if (counterRef.current) {
            const progress = Math.round(this.progress() * 100);
            counterRef.current.textContent = `${progress}%`;
          }
        },
      },
      "-=0.3"
    );

    tl.to({}, { duration: 0.3 });

    tl.to(textRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.4,
      ease: "power2.in",
    });

    tl.to(
      overlayTopRef.current,
      { yPercent: -100, duration: 1, ease: "power4.inOut" },
      "-=0.1"
    );

    tl.to(
      overlayBottomRef.current,
      {
        yPercent: 100,
        duration: 1,
        ease: "power4.inOut",
        onComplete: () => setVisible(false),
      },
      "<"
    );

    return () => {
      tl.kill();
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="loader-wrapper">
      <div ref={overlayTopRef} className="loader-curtain loader-curtain--top">
        <div ref={textRef} className="loader-content">
          <div className="loader-logo">
            <span className="loader-logo-legacy">LEGACY</span>
            <span className="loader-logo-caps">CAPS</span>
          </div>
          <div className="loader-progress-track">
            <div ref={progressRef} className="loader-progress-bar" />
          </div>
          <span ref={counterRef} className="loader-counter">
            0%
          </span>
        </div>
      </div>
      <div
        ref={overlayBottomRef}
        className="loader-curtain loader-curtain--bottom"
      />
    </div>
  );
};

export default Loader;
