import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentSession } from "@/lib/session";
import { SITE_ASSETS } from "@/lib/site-assets";

const PROFILE_IMAGE = SITE_ASSETS.logo;

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/ebooks", label: "Ebook" },
  { href: "/learn", label: "Courses" },
  { href: "/newsletter", label: "Newsletter" },
  { href: "/community", label: "Community" },
  { href: "/blog", label: "Blog" },
];

export async function LandingHeader() {
  const session = await getCurrentSession();
  const isAdmin = session?.user.role === "ADMIN";
  const isInstructor = session?.user.role === "INSTRUCTOR";

  return (
    <header className="sticky top-0 z-[60] w-full border-b border-white/20 bg-surface/95 shadow-sm backdrop-blur-xl">
      <nav className="site-container flex items-center justify-between gap-3 py-3 md:gap-6 md:py-5">
        <Link
          href="/"
          className="shrink-0 text-lg font-bold tracking-tight text-primary md:font-headline-lg md:text-headline-lg"
        >
          Sikau Paisa
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-[15px] font-semibold tracking-wide text-on-surface-variant transition-colors hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-2 md:gap-3">
          {session?.user ? (
            <>
              {(isAdmin || isInstructor) && (
                <Link
                  href={isAdmin ? "/admin" : "/instructor"}
                  className="rounded-xl border border-outline-variant/40 px-3 py-2 text-sm font-semibold text-on-background md:px-5 md:py-2.5"
                >
                  {isAdmin ? "Admin" : "Instructor"}
                </Link>
              )}
              <LogoutButton className="emerald-gradient rounded-xl px-3 py-2 text-sm font-semibold text-white md:px-5 md:py-2.5" />
            </>
          ) : (
            <Link
              href="/login"
              className="emerald-gradient rounded-xl px-3 py-2 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] md:px-5 md:py-2.5"
            >
              Login
            </Link>
          )}
          <div className="hidden h-10 w-10 overflow-hidden rounded-full border-2 border-primary/25 bg-secondary-container ring-2 ring-white sm:block">
            <Image
              src={PROFILE_IMAGE}
              alt=""
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </nav>
    </header>
  );
}
