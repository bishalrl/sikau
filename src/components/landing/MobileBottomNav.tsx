"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "./MaterialIcon";
import { isMobileNavActive, MOBILE_NAV_LINKS } from "@/lib/mobile-nav";

type Props = {
  isLoggedIn?: boolean;
};

export function MobileBottomNav({ isLoggedIn = false }: Props) {
  const pathname = usePathname();
  const links = [
    ...MOBILE_NAV_LINKS,
    isLoggedIn
      ? { href: "/community", icon: "groups", label: "Community" }
      : { href: "/login", icon: "person", label: "Login" },
  ];

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-0 z-[60] flex w-full items-center justify-around gap-0.5 border-t border-white/20 bg-surface/95 px-1 pt-2 shadow-[0px_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-2xl md:hidden"
      aria-label="Mobile navigation"
    >
      {links.map((link) => {
        const active = isMobileNavActive(pathname, link.href);
        return (
          <Link
            key={`${link.href}-${link.label}`}
            href={link.href}
            className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 ${
              active ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            <MaterialIcon name={link.icon} filled={Boolean(active)} className="text-[22px]" />
            <span className="max-w-full px-0.5 text-center text-[9px] font-semibold leading-[1.15] tracking-tight">
              {link.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
