import Image from "next/image";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentSession } from "@/lib/session";
import { MaterialIcon } from "./MaterialIcon";

const PROFILE_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDCRgofTwfYPqlDF_ZPoDfAzDLwPvo-J_8ztB6Ql3aJF9HubWqrYxvXBH29KVrSONQJZQizgNpMeizkRaJXie-RRLubOuTiy7F0U7gVoShetGFX3s51QdAPct6OhW0GNA-GfIHYIi6yro3djWpAemwdZM0nGUH9HPyQCUjZklQzZYmIrfVzU2pgN706p6G5gTj1J6K4smHG3-vddEh51NNJe_JgRfBuReW7JXrX5h7PIZ-mx5URQnIF1lLPBhOOFkJiKGPyV4vlIk0";

const navLinks = [
  { href: "/learn", label: "Learn", active: true },
  { href: "/blog", label: "Blog" },
  { href: "/ebooks", label: "Ebooks" },
  { href: "#community", label: "Community" },
];

export async function LandingHeader() {
  const session = await getCurrentSession();
  const isAdmin = session?.user.role === "ADMIN";
  const isInstructor = session?.user.role === "INSTRUCTOR";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/20 bg-surface/80 shadow-sm backdrop-blur-xl">
      <nav className="site-container flex items-center justify-between gap-6 py-4 md:py-5">
        <Link href="/" className="shrink-0 font-headline-lg text-headline-lg font-bold tracking-tight text-primary">
          Sikau Paisa
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          {navLinks.map((link) =>
            link.href.startsWith("/") ? (
              <Link
                key={link.label}
                href={link.href}
                className={`text-[15px] font-semibold tracking-wide transition-colors ${
                  link.active ? "text-primary" : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {link.label}
              </Link>
            ) : (
              <a
                key={link.label}
                href={link.href}
                className="text-[15px] font-semibold tracking-wide text-on-surface-variant transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ),
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 pr-1 md:gap-4 md:pr-2">
          <button
            type="button"
            className="hidden rounded-lg p-2.5 text-primary transition-all hover:bg-primary-container/15 sm:block"
            aria-label="Notifications"
          >
            <MaterialIcon name="notifications" />
          </button>
          <button
            type="button"
            className="hidden rounded-lg p-2.5 text-primary transition-all hover:bg-primary-container/15 sm:block"
            aria-label="Premium"
          >
            <MaterialIcon name="workspace_premium" />
          </button>
          {session?.user ? (
            <>
              {(isAdmin || isInstructor) && (
                <Link
                  href={isAdmin ? "/admin" : "/instructor"}
                  className="hidden rounded-xl border border-outline-variant/40 px-5 py-2.5 text-sm font-semibold text-on-background md:inline-flex"
                >
                  {isAdmin ? "Admin Panel" : "Instructor"}
                </Link>
              )}
              <LogoutButton className="emerald-gradient hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5 md:inline-flex" />
            </>
          ) : (
            <Link
              href="/login"
              className="emerald-gradient hidden rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-[0_4px_16px_rgba(16,185,129,0.25)] transition-all hover:-translate-y-0.5 md:inline-flex"
            >
              Login / Sign Up
            </Link>
          )}
          <div className="ml-1 h-10 w-10 overflow-hidden rounded-full border-2 border-primary/25 bg-secondary-container ring-2 ring-white">
            <Image
              src={PROFILE_IMAGE}
              alt="User Profile"
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
