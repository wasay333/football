"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import MobileNav from "./mobile-nav";
import SearchBar from "./search-bar";
import PlayerDropdown from "./player-dropdown";
import { useCart } from "@/hooks/cart-context";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/product", label: "Products" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const Header = () => {
  const headerRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const { totalItems } = useCart();

  useEffect(() => {
    const isHome = pathname === "/";
    const loaderAlreadyShown = typeof window !== "undefined" && !!sessionStorage.getItem("loader_shown");
    const needsDelay = isHome && !loaderAlreadyShown;
    gsap.fromTo(
      headerRef.current,
      { y: needsDelay ? -80 : 0, opacity: 0 },
      { y: 0, opacity: 1, duration: needsDelay ? 0.8 : 0.3, ease: "power3.out", delay: needsDelay ? 3.8 : 0 }
    );
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header ref={headerRef} className={`site-header ${scrolled ? "header-scrolled" : ""}`} style={{ opacity: 0 }}>
      <div className="header-logo">
        <Link href="/">
          <Image
            src="/foocapsnewlogo.png"
            alt="Foocaps"
            width={100}
            height={28}
            style={{ objectFit: "contain" }}
            priority
          />
        </Link>
      </div>

      {/* Desktop only */}
      <nav className="header-nav">
        <ul>
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={pathname === link.href ? "active" : ""}
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li>
            <PlayerDropdown />
          </li>
        </ul>
      </nav>

      <div className="header-actions">
        <SearchBar />
        <Link href="/cart" className="header-cart" aria-label="Cart">
          <span className="header-cart-icon-wrap">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {totalItems > 0 && (
              <span className="header-cart-badge">{totalItems > 99 ? "99+" : totalItems}</span>
            )}
          </span>
          <span>Cart</span>
        </Link>
      </div>

      {/* Mobile only */}
      <MobileNav />
    </header>
  );
};

export default Header;
