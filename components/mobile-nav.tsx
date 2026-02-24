"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/product", label: "Products" },
  { href: "/about", label: "About" },
  { href: "/cart", label: "Cart" },
];

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        className={`hamburger ${open ? "open" : ""}`}
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <span />
        <span />
        <span />
      </button>

      {open && <div className="mobile-overlay" onClick={() => setOpen(false)} />}

      <aside className={`mobile-drawer ${open ? "open" : ""}`}>
        <div className="mobile-drawer-logo">
          Legacy <span>Caps</span>
        </div>

        <nav>
          <ul>
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={pathname === link.href ? "active" : ""}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mobile-drawer-actions">
          <Link href="/cart" className="mobile-btn-cart" onClick={() => setOpen(false)}>
            Cart
          </Link>
        </div>
      </aside>
    </>
  );
};

export default MobileNav;
