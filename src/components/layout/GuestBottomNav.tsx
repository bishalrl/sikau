"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MaterialIcon } from "@/components/landing/MaterialIcon";

type Props = {
  isLoggedIn?: boolean;
};

export function GuestBottomNav({ isLoggedIn = false }: Props) {
  const pathname = usePathname();

  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/admin") ||
    pathname.includes("/read") ||
    pathname.includes("/pay")
  ) {
    return null;
  }

  const links = [
    { href: "/", icon: "home", label: "Home" },
    { href: "/ebooks", icon: "menu_book", label: "Ebook" },
    { href: "/blog", icon: "article", label: "Blog" },
    isLoggedIn
      ? { href: "/ebooks#packages", icon: "shopping_bag", label: "Buy" }
      : { href: "/login", icon: "person", label: "Login" },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 z-[60] flex w-full items-center justify-around border-t border-outline-variant/40 bg-surface/95 px-4 py-2.5 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:hidden"
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : link.href.startsWith("/ebooks")
              ? pathname === "/ebooks" || pathname.startsWith("/ebooks/")
              : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex min-w-[64px] cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg px-3 py-1.5 ${
              active ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            <MaterialIcon name={link.icon} filled={Boolean(active)} />
            <span className="text-[10px] font-semibold">{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
