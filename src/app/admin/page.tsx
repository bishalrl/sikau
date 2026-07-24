import Link from "next/link";
import {
  ArrowUpRight,
  BookOpen,
  FileText,
  Radio,
  ScrollText,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { getAdminOverview } from "@/lib/repositories";

type Stat = {
  label: string;
  value: number;
  icon: LucideIcon;
  href: string;
  accent: string;
};

export default async function AdminPage() {
  const overview = await getAdminOverview();

  const stats: Stat[] = [
    { label: "Users", value: overview.users, icon: Users, href: "/admin/payments", accent: "admin-stat--blue" },
    { label: "Courses", value: overview.courses, icon: BookOpen, href: "/admin/courses", accent: "admin-stat--green" },
    { label: "Blog Posts", value: overview.blogs, icon: FileText, href: "/admin/blogs", accent: "admin-stat--violet" },
    { label: "Ebooks", value: overview.ebooks, icon: BookOpen, href: "/admin/ebooks", accent: "admin-stat--amber" },
    {
      label: "Pending Payments",
      value: overview.pendingPayments,
      icon: Wallet,
      href: "/admin/payments",
      accent: "admin-stat--rose",
    },
    {
      label: "CMS Entries",
      value: overview.contentEntries,
      icon: ScrollText,
      href: "/admin/content",
      accent: "admin-stat--slate",
    },
  ];

  const quickActions = [
    { label: "Build a course", href: "/admin/courses", icon: BookOpen },
    { label: "Schedule live session", href: "/admin/live", icon: Radio },
    { label: "Review payments", href: "/admin/payments", icon: Wallet },
    { label: "Edit website content", href: "/admin/content", icon: ScrollText },
  ];

  return (
    <section className="space-y-8">
      <div>
        <p className="admin-page__eyebrow">Admin Overview</p>
        <h1 className="admin-page__title">Operations Dashboard</h1>
        <p className="admin-page__subtitle">
          Track your academy at a glance and jump straight into the work that needs you.
        </p>
      </div>

      {overview.pendingPayments > 0 && (
        <Link href="/admin/payments" className="admin-alert">
          <Wallet size={18} />
          <span>
            {overview.pendingPayments} payment{overview.pendingPayments > 1 ? "s" : ""} awaiting review
          </span>
          <ArrowUpRight size={16} className="admin-alert__arrow" />
        </Link>
      )}

      <div className="admin-stat-grid">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href} className={`admin-stat ${stat.accent}`}>
              <div className="admin-stat__head">
                <span className="admin-stat__icon">
                  <Icon size={20} />
                </span>
                <ArrowUpRight size={16} className="admin-stat__arrow" />
              </div>
              <p className="admin-stat__value">{stat.value}</p>
              <p className="admin-stat__label">{stat.label}</p>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="admin-section__title">Quick actions</h2>
        <div className="admin-actions">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link key={action.href} href={action.href} className="admin-action">
                <span className="admin-action__icon">
                  <Icon size={18} />
                </span>
                <span className="admin-action__label">{action.label}</span>
                <ArrowUpRight size={16} className="admin-action__arrow" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
