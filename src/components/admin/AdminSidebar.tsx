"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  MessageSquareQuote,
  Radio,
  ScrollText,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  description: string;
};

const links: NavLink[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, description: "Operations at a glance" },
  { href: "/admin/content", label: "Website Content", icon: ScrollText, description: "Pages, images, SEO" },
  { href: "/admin/courses", label: "Courses", icon: BookOpen, description: "Build & publish" },
  { href: "/admin/blogs", label: "Blog", icon: FileText, description: "Articles" },
  { href: "/admin/ebooks", label: "Ebooks", icon: BookOpen, description: "Digital products" },
  { href: "/admin/communities", label: "Communities", icon: Users, description: "Groups & chat" },
  { href: "/admin/live", label: "Live sessions", icon: Radio, description: "Schedule & host" },
  { href: "/admin/payments", label: "Payments", icon: Wallet, description: "Review receipts" },
  { href: "/admin/users", label: "Users", icon: Users, description: "Verified emails" },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail, description: "Paid group & posts" },
  { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote, description: "Public feedback" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const current = links.find((link) => isActive(pathname, link.href));

  return (
    <aside className={`admin-sidebar ${open ? "is-open" : ""}`}>
      <Link href="/admin" className="admin-sidebar__brand">
        <span className="admin-sidebar__logo">SP</span>
        <span>
          <span className="admin-sidebar__brand-name">Sikau Paisa</span>
          <span className="admin-sidebar__brand-tag">Admin Console</span>
        </span>
      </Link>

      <button
        type="button"
        className="admin-sidebar__mobile-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
      >
        <span>{current?.label ?? "Menu"}</span>
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      <nav className="admin-sidebar__nav" aria-label="Admin navigation">
        {links.map((link) => {
          const active = isActive(pathname, link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={`admin-nav-link ${active ? "is-active" : ""}`}
              onClick={() => setOpen(false)}
            >
              <span className="admin-nav-link__icon">
                <Icon size={18} />
              </span>
              <span className="admin-nav-link__copy">
                <span className="admin-nav-link__label">{link.label}</span>
                <span className="admin-nav-link__desc">{link.description}</span>
              </span>
            </Link>
          );
        })}
      </nav>

      <LogoutButton className="admin-sidebar__logout" />
    </aside>
  );
}
