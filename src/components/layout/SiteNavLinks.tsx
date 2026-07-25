"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/ebooks", label: "Ebook" },
  { href: "/community", label: "Community" },
  { href: "/blog", label: "Blog" },
];

export function SiteNavLinks({ className = "" }: { className?: string }) {
  const pathname = usePathname();

  return (
    <div className={`flex items-center gap-6 ${className}`}>
      {navLinks.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`relative z-10 cursor-pointer text-[15px] font-semibold tracking-wide transition-colors ${
              active ? "text-primary" : "text-on-surface-variant hover:text-primary"
            }`}
            onClick={() => {
              if (pathname === link.href || (link.href !== "/" && pathname.startsWith(`${link.href}/`))) {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}
