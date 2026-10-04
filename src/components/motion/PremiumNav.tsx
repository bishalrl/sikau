"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

type NavLink = { href: string; label: string };

type Props = {
  siteName: string;
  links: NavLink[];
  actions: ReactNode;
  logo?: ReactNode;
  variant?: "landing" | "site";
};

export function PremiumNav({ siteName, links, actions, logo, variant = "landing" }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`premium-nav ${variant === "site" ? "premium-nav--site" : ""} ${scrolled ? "is-scrolled" : ""}`}
    >
      <nav className="site-container flex items-center justify-between gap-3 py-3 md:gap-6 md:py-4">
        <Link href="/" className="premium-nav__brand shrink-0">
          {logo ?? <span className="text-lg font-bold tracking-tight text-primary">{siteName}</span>}
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="premium-nav__link">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden sm:flex sm:items-center sm:gap-2">{actions}</div>
          <button
            type="button"
            className="premium-nav__menu-btn md:hidden"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      <div className={`premium-nav__drawer md:hidden ${open ? "is-open" : ""}`}>
        <div className="site-container space-y-1 py-3">
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              className="premium-nav__drawer-link"
              style={{ transitionDelay: open ? `${index * 40}ms` : "0ms" }}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="border-t border-outline-variant/30 pt-3 sm:hidden">{actions}</div>
        </div>
      </div>
    </header>
  );
}
