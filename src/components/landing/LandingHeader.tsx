import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { CmsImage } from "@/components/cms/CmsImage";
import { PremiumNav } from "@/components/motion/PremiumNav";
import { getPublicCms } from "@/lib/cms/public";
import { getCurrentSession } from "@/lib/session";
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

export async function LandingHeader() {
  const [session, cms] = await Promise.all([getCurrentSession(), getPublicCms()]);
  const navLinks = cms.nav.length ? cms.nav : fallbackNav;
  const siteName = cms.site.name || "Sikau Paisa";
  const logo = cms.site.logo || SITE_ASSETS.logo;
  const isAdmin = session?.user.role === "ADMIN";
  const isInstructor = session?.user.role === "INSTRUCTOR";

  const actions = session?.user ? (
    <>
      {(isAdmin || isInstructor) && (
        <Link
          href={isAdmin ? "/admin" : "/instructor"}
          className="rounded-xl border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-on-background transition hover:-translate-y-0.5 md:px-5 md:py-2.5"
        >
          {isAdmin ? "Admin" : "Instructor"}
        </Link>
      )}
      <LogoutButton className="btn-arrow emerald-gradient rounded-xl px-3 py-2 text-sm font-semibold text-white md:px-5 md:py-2.5" />
    </>
  ) : (
    <Link
      href="/login"
      className="btn-arrow emerald-gradient rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] md:px-5 md:py-2.5"
    >
      <span>Login</span>
      <span className="btn-arrow__icon" aria-hidden="true">
        →
      </span>
    </Link>
  );

  return (
    <PremiumNav
      siteName={siteName}
      links={navLinks}
      actions={actions}
      logo={
        <span className="flex items-center gap-2">
          <span className="hidden h-9 w-9 overflow-hidden rounded-full border-2 border-primary/25 bg-secondary-container ring-2 ring-white sm:block">
            <CmsImage src={logo} alt="" width={36} height={36} className="h-full w-full object-cover" />
          </span>
          <span className="text-lg font-bold tracking-tight text-primary md:font-headline-lg md:text-headline-lg">
            {siteName}
          </span>
        </span>
      }
    />
  );
}
