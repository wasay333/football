"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

type Footballer = {
  id: string;
  name: string;
  profileImage: string | null;
  products: { id: string }[];
};

export default function PlayerDropdown() {
  const [open, setOpen] = useState(false);
  const [footballers, setFootballers] = useState<Footballer[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/search")
      .then((r) => r.json())
      .then((data) => setFootballers(data.footballers ?? []));
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open, close]);

  const go = useCallback((f: Footballer) => {
    const pid = f.products[0]?.id;
    router.push(pid ? `/product/${pid}` : "/product");
    close();
  }, [router, close]);

  if (!footballers.length) return null;

  return (
    <div ref={wrapRef} className="pd-wrap">
      <button
        className={`pd-trigger ${open ? "pd-trigger--open" : ""}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        Players
        <svg
          className="pd-chevron"
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="pd-dropdown">
          {footballers.map((f) => (
            <button key={f.id} className="pd-item" onClick={() => go(f)}>
              <div className="pd-avatar">
                {f.profileImage ? (
                  <Image
                    src={f.profileImage}
                    alt={f.name}
                    fill
                    sizes="32px"
                    style={{ objectFit: "cover", objectPosition: "top" }}
                  />
                ) : (
                  <span className="pd-avatar-initial">{f.name[0]}</span>
                )}
              </div>
              <span className="pd-item-name">{f.name}</span>
              <svg
                className="pd-item-arrow"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
