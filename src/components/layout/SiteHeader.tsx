import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { SiteNavLinks } from "@/components/layout/SiteNavLinks";
import { getCurrentSession } from "@/lib/session";
import { getPublicCms } from "@/lib/cms/public";
import { SITE_ASSETS } from "@/lib/site-assets";

export async function SiteHeader() {
  const [session, cms] = await Promise.all([getCurrentSession(), getPublicCms()]);
  const siteName = cms.site.name || "Sikau Paisa";
  const tagline = cms.site.tagline || "Learn · Grow · Earn";
  const logo = cms.site.logo || SITE_ASSETS.logo;
  const isAdmin = session?.user.role === "ADMIN";
  const isInstructor = session?.user.role === "INSTRUCTOR";

  return (
    <header className="sticky top-0 z-[60] border-b border-outline-variant/30 bg-surface/95 shadow-sm backdrop-blur-xl">
      <nav className="site-container relative z-[61] flex items-center justify-between gap-3 py-3 md:gap-6 md:py-5">
        <Link href="/" className="relative z-[62] flex shrink-0 cursor-pointer items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-white md:h-9 md:w-9 md:rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt={siteName} className="h-full w-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-on-background md:font-label-md">{siteName}</p>
            <p className="hidden text-[10px] font-semibold uppercase tracking-wider text-primary sm:block">
              {tagline}
            </p>
          </div>
        </Link>

        <SiteNavLinks className="hidden md:flex" links={cms.nav} />

        <div className="flex shrink-0 items-center gap-2">
          {session?.user ? (
            <>
              {(isAdmin || isInstructor) && (
                <Link
                  href={isAdmin ? "/admin" : "/instructor"}
                  className="hidden rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-background md:inline-flex"
                >
                  {isAdmin ? "Admin" : "Instructor"}
                </Link>
              )}
              <LogoutButton className="emerald-gradient hidden rounded-xl px-4 py-2 text-sm font-semibold text-white md:inline-flex" />
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-on-background md:px-5"
            >
              Login
            </Link>
          )}

          <details className="group relative md:hidden">
            <summary className="flex min-h-11 min-w-11 cursor-pointer list-none items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5 group-open:hidden" />
              <X className="hidden h-5 w-5 group-open:block" />
            </summary>
            <div className="absolute right-0 z-[70] mt-2 w-60 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-lg">
              {(cms.nav.length ? cms.nav : [
                { href: "/", label: "Home" },
                { href: "/ebooks", label: "Ebook" },
                { href: "/newsletter", label: "Newsletter" },
                { href: "/community", label: "Community" },
                { href: "/blog", label: "Blog" },
              ]).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block cursor-pointer rounded-lg px-3 py-3 text-sm font-semibold text-on-background hover:bg-primary-container/10 hover:text-primary"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-2 border-t border-outline-variant/30 pt-2">
                {session?.user ? (
                  <>
                    {(isAdmin || isInstructor) && (
                      <Link
                        href={isAdmin ? "/admin" : "/instructor"}
                        className="mb-2 block rounded-xl px-4 py-3 text-sm font-semibold text-on-background hover:bg-surface-container"
                      >
                        {isAdmin ? "Admin Panel" : "Instructor"}
                      </Link>
                    )}
                    <LogoutButton className="emerald-gradient flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white" />
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="mb-2 block rounded-xl px-4 py-3 text-center text-sm font-semibold text-on-background hover:bg-surface-container"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="emerald-gradient flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
