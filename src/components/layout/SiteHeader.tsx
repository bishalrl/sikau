import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { PremiumNav } from "@/components/motion/PremiumNav";
import { getCurrentSession } from "@/lib/session";
import { getPublicCms } from "@/lib/cms/public";
import { SITE_ASSETS } from "@/lib/site-assets";

const fallbackNav = [
  { href: "/", label: "Home" },
  { href: "/ebooks", label: "Ebook" },
  { href: "/learn", label: "Courses" },
  { href: "/tools", label: "Tools" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/community", label: "Community" },
  { href: "/blog", label: "Blog" },
];

export async function SiteHeader() {
  const [session, cms] = await Promise.all([getCurrentSession(), getPublicCms()]);
  const siteName = cms.site.name || "Sikau Paisa";
  const tagline = cms.site.tagline || "Learn · Grow · Earn";
  const logo = cms.site.logo || SITE_ASSETS.logo;
  const isAdmin = session?.user.role === "ADMIN";
  const isInstructor = session?.user.role === "INSTRUCTOR";
  const navLinks = cms.nav.length ? cms.nav : fallbackNav;

  const actions = session?.user ? (
    <>
      {(isAdmin || isInstructor) && (
        <Link
          href={isAdmin ? "/admin" : "/instructor"}
          className="rounded-xl border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-on-background transition hover:-translate-y-0.5 md:px-4 md:py-2"
        >
          {isAdmin ? "Admin" : "Instructor"}
        </Link>
      )}
      <LogoutButton className="btn-arrow emerald-gradient rounded-xl px-3 py-2 text-sm font-semibold text-white md:px-4 md:py-2" />
    </>
  ) : (
    <Link
      href="/login"
      className="btn-arrow rounded-xl border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-on-background md:px-5"
    >
      <span>Login</span>
      <span className="btn-arrow__icon" aria-hidden="true">
        →
      </span>
    </Link>
  );

  return (
    <PremiumNav
      variant="site"
      siteName={siteName}
      links={navLinks}
      actions={actions}
      logo={
        <span className="flex items-center gap-2">
          <span className="relative h-8 w-8 overflow-hidden rounded-lg bg-white md:h-9 md:w-9 md:rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={siteName} className="h-full w-full object-cover" />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-on-background md:font-label-md">
              {siteName}
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-wider text-primary sm:block">
              {tagline}
            </span>
          </span>
        </span>
      }
    />
  );
}
