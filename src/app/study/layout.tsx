import Link from "next/link";
import { getPublicCms } from "@/lib/cms/public";
import { getCurrentSession } from "@/lib/session";

export default async function StudyLayout({ children }: { children: React.ReactNode }) {
  const [cms, session] = await Promise.all([getPublicCms(), getCurrentSession()]);
  const siteName = cms.site.name || "Sikau Paisa";

  return (
    <div className="min-h-screen bg-surface">
      <header className="sticky top-0 z-40 border-b border-outline-variant/30 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-3 px-4 sm:px-6">
          <Link href="/" className="truncate text-sm font-semibold text-on-background">
            {siteName}
          </Link>
          <nav className="flex shrink-0 items-center gap-3 text-sm font-medium">
            <Link href="/learn" className="text-on-surface-variant hover:text-primary">
              Courses
            </Link>
            {session?.user ? (
              <Link href="/dashboard" className="text-primary">
                My learning
              </Link>
            ) : (
              <Link href="/login" className="text-primary">
                Login
              </Link>
            )}
          </nav>
        </div>
      </header>
      {children}
    </div>
  );
}
