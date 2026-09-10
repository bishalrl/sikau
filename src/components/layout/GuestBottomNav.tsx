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
    pathname.startsWith("/verify-email") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/community/") ||
    pathname.includes("/read") ||
    pathname.includes("/pay")
  ) {
    return null;
  }

  const links = [
    { href: "/", icon: "home", label: "Home" },
    { href: "/ebooks", icon: "menu_book", label: "Ebook" },
    { href: "/newsletter", icon: "mail", label: "News" },
    { href: "/community", icon: "groups", label: "Community" },
    isLoggedIn
      ? { href: "/learn", icon: "school", label: "Courses" }
      : { href: "/login", icon: "person", label: "Login" },
  ];

  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-0 z-[60] flex w-full items-center justify-around border-t border-outline-variant/40 bg-surface/95 px-2 pt-2 shadow-[0_-4px_20px_rgba(15,23,42,0.08)] backdrop-blur-xl md:hidden"
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : link.href.startsWith("/ebooks")
              ? pathname === "/ebooks" || pathname.startsWith("/ebooks/")
              : link.href.startsWith("/learn")
                ? pathname === "/learn" || pathname.startsWith("/learn/") || pathname.startsWith("/study/")
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.label}
            href={link.href}
            className={`flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-xl px-2 py-1 ${
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
