import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentSession } from "@/lib/session";

const navLinks = [
  { href: "/learn", label: "Learn" },
  { href: "/blog", label: "Blog" },
  { href: "/ebooks", label: "Ebooks" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/quiz", label: "Quiz" },
];

export async function SiteHeader() {
  const session = await getCurrentSession();
  const isAdmin = session?.user.role === "ADMIN";
  const isInstructor = session?.user.role === "INSTRUCTOR";

  return (
    <header className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/80 shadow-sm backdrop-blur-xl">
      <nav className="site-container flex items-center justify-between gap-6 py-4 md:py-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-sm font-bold text-white">
            SP
          </div>
          <div>
            <p className="font-label-md text-on-background">Sikau Paisa</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">
              Fintech Academy
            </p>
          </div>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[15px] font-semibold tracking-wide text-on-surface-variant transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {session?.user ? (
            <>
              {(isAdmin || isInstructor) && (
                <Link
                  href={isAdmin ? "/admin" : "/instructor"}
                  className="rounded-xl border border-outline-variant/40 px-5 py-2.5 text-sm font-semibold text-on-background"
                >
                  {isAdmin ? "Admin Panel" : "Instructor"}
                </Link>
              )}
              <LogoutButton className="emerald-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5" />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl border border-outline-variant/40 px-5 py-2.5 text-sm font-semibold text-on-background"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="emerald-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        <details className="relative md:hidden">
          <summary className="flex cursor-pointer list-none items-center rounded-lg p-2 text-on-surface-variant hover:bg-surface-container [&::-webkit-details-marker]:hidden">
            <Menu className="h-5 w-5 open:hidden" />
            <X className="hidden h-5 w-5 open:block" />
          </summary>
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-outline-variant/30 bg-surface-container-lowest p-2 card-shadow-lg">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-on-surface-variant hover:bg-primary-container/10 hover:text-primary"
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
                      className="mb-2 block rounded-xl px-4 py-2.5 text-sm font-semibold text-on-background hover:bg-surface-container"
                    >
                      {isAdmin ? "Admin Panel" : "Instructor"}
                    </Link>
                  )}
                  <LogoutButton className="emerald-gradient flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white" />
                </>
              ) : (
                <Link
                  href="/login"
                  className="emerald-gradient flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Login / Sign Up
                </Link>
              )}
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
