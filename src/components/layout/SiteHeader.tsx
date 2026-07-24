import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { SiteNavLinks } from "@/components/layout/SiteNavLinks";
import { getCurrentSession } from "@/lib/session";
import { SITE_ASSETS } from "@/lib/site-assets";

export async function SiteHeader() {
  const session = await getCurrentSession();
  const isAdmin = session?.user.role === "ADMIN";
  const isInstructor = session?.user.role === "INSTRUCTOR";

  return (
    <header className="sticky top-0 z-[60] border-b border-outline-variant/30 bg-surface/95 shadow-sm backdrop-blur-xl">
      <nav className="site-container relative z-[61] flex items-center justify-between gap-4 py-4 md:gap-6 md:py-5">
        <Link href="/" className="relative z-[62] flex shrink-0 cursor-pointer items-center gap-2.5">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={SITE_ASSETS.logo} alt="Sikau Paisa" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="font-label-md text-on-background">Sikau Paisa</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Learn · Grow · Earn
            </p>
          </div>
        </Link>

        {/* Always visible — guests could not press Ebook when it was md-only */}
        <SiteNavLinks className="hidden sm:flex" />

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {session?.user ? (
            <>
              {(isAdmin || isInstructor) && (
                <Link
                  href={isAdmin ? "/admin" : "/instructor"}
                  className="hidden rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-semibold text-on-background sm:inline-flex"
                >
                  {isAdmin ? "Admin" : "Instructor"}
                </Link>
              )}
              <LogoutButton className="emerald-gradient hidden rounded-xl px-4 py-2 text-sm font-semibold text-white sm:inline-flex" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-on-background sm:px-5 sm:py-2.5"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="emerald-gradient hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] sm:inline-flex"
              >
                Sign Up
              </Link>
            </>
          )}

          <details className="relative sm:hidden">
            <summary className="flex cursor-pointer list-none items-center rounded-lg p-2 text-on-surface-variant hover:bg-surface-container [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" />
              <X className="hidden h-5 w-5" />
            </summary>
            <div className="absolute right-0 z-[70] mt-2 w-56 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2 shadow-lg">
              <Link
                href="/"
                className="block cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold text-on-background hover:bg-primary-container/10 hover:text-primary"
              >
                Home
              </Link>
              <Link
                href="/ebooks"
                className="block cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold text-on-background hover:bg-primary-container/10 hover:text-primary"
              >
                Ebook
              </Link>
              <Link
                href="/blog"
                className="block cursor-pointer rounded-lg px-3 py-2.5 text-sm font-semibold text-on-background hover:bg-primary-container/10 hover:text-primary"
              >
                Blog
              </Link>
              <div className="mt-2 border-t border-outline-variant/30 pt-2">
                {session?.user ? (
                  <>
                    {(isAdmin || isInstructor) && (
                      <Link
                        href={isAdmin ? "/admin" : "/instructor"}
                        className="mb-2 block rounded-xl px-4 py-2.5 text-sm font-semibold text-on-background hover:bg-surface-container"
                      >
                        {isAdmin ? "Admin Panel" : "Instructor"}
                      </Link>
                    )}
                    <LogoutButton className="emerald-gradient flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white" />
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="mb-2 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-on-background hover:bg-surface-container"
                    >
                      Login
                    </Link>
                    <Link
                      href="/signup"
                      className="emerald-gradient flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
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
