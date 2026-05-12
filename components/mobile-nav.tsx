"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import SearchBar from "./search-bar";
import { isUploadedAssetPath } from "@/lib/image";

const toTitleCase = (str: string) =>
  str.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

type Footballer = {
  id: string;
  name: string;
  profileImage: string | null;
  products: { id: string }[];
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/product", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/cart", label: "Cart" },
];

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const [playersOpen, setPlayersOpen] = useState(false);
  const [footballers, setFootballers] = useState<Footballer[]>([]);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    fetch("/api/search")
      .then((r) => r.json())
      .then((data) => setFootballers(data.footballers ?? []));
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const closeAll = () => {
    setOpen(false);
    setPlayersOpen(false);
  };

  const goToPlayer = (f: Footballer) => {
    const pid = f.products[0]?.id;
    router.push(pid ? `/product/${pid}` : "/product");
    closeAll();
  };

  return (
    <>
      <div className="mobile-header-actions">
        <SearchBar />
        <button
          className={`hamburger ${open ? "open" : ""}`}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {open && <div className="mobile-overlay" onClick={closeAll} />}

      <aside className={`mobile-drawer ${open ? "open" : ""}`}>
        <div className="mobile-drawer-logo">
          <Image
            src="/foocapsnewlogo.png"
            alt="Foocaps"
            width={90}
            height={26}
            style={{ objectFit: "contain" }}
          />
        </div>

        <nav>
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={pathname === link.href ? "active" : ""}
                  onClick={closeAll}
                >
                  {link.label}
                </Link>
              </li>
            ))}

            {/* Players accordion */}
            {footballers.length > 0 && (
              <li className="mn-players-item">
                <button
                  className={`mn-players-trigger ${playersOpen ? "mn-players-trigger--open" : ""}`}
                  onClick={() => setPlayersOpen((o) => !o)}
                >
                  Players
                  <svg
                    className="mn-chevron"
                    width="13"
                    height="13"
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

                {playersOpen && (
                  <div className="mn-players-list">
                    {footballers.map((f) => (
                      <button
                        key={f.id}
                        className="mn-player-btn"
                        onClick={() => goToPlayer(f)}
                      >
                        <div className="mn-player-avatar">
                          {f.profileImage ? (
                            <Image
                              src={f.profileImage}
                              alt={f.name}
                              fill
                              sizes="28px"
                              unoptimized={isUploadedAssetPath(f.profileImage)}
                              style={{ objectFit: "cover", objectPosition: "top" }}
                            />
                          ) : (
                            <span>{f.name[0]}</span>
                          )}
                        </div>
                        <span>{toTitleCase(f.name)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </li>
            )}
          </ul>
        </nav>

        <div className="mobile-drawer-actions">
          <Link href="/cart" className="mobile-btn-cart" onClick={closeAll}>
            Cart
          </Link>
        </div>
      </aside>
    </>
  );
};

export default MobileNav;
