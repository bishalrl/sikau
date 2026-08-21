import { GuestBottomNav } from "@/components/layout/GuestBottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCurrentSession } from "@/lib/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  return (
    <div className="has-mobile-bottom-nav flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <GuestBottomNav isLoggedIn={Boolean(session?.user)} />
    </div>
  );
}
