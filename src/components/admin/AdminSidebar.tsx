"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  FileText,
  LayoutDashboard,
  Mail,
  Radio,
  ScrollText,
  Users,
  Wallet,
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
  { href: "/admin/content", label: "Website Content", icon: ScrollText, description: "Edit site copy" },
  { href: "/admin/courses", label: "Courses", icon: BookOpen, description: "Build & publish" },
  { href: "/admin/blogs", label: "Blog", icon: FileText, description: "Articles" },
  { href: "/admin/ebooks", label: "Ebooks", icon: BookOpen, description: "Digital products" },
  { href: "/admin/communities", label: "Communities", icon: Users, description: "Groups & chat" },
  { href: "/admin/live", label: "Live sessions", icon: Radio, description: "Schedule & host" },
  { href: "/admin/payments", label: "Payments", icon: Wallet, description: "Review receipts" },
  { href: "/admin/users", label: "Users", icon: Users, description: "Verified emails" },
  { href: "/admin/newsletter", label: "Newsletter", icon: Mail, description: "Subscriber emails" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-sidebar__brand">
        <span className="admin-sidebar__logo">SP</span>
        <span>
          <span className="admin-sidebar__brand-name">Sikau Paisa</span>
          <span className="admin-sidebar__brand-tag">Admin Console</span>
        </span>
      </Link>

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
