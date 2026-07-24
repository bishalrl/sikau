import { GuestBottomNav } from "@/components/layout/GuestBottomNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { getCurrentSession } from "@/lib/session";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 pb-20 sm:pb-0">{children}</main>
      <SiteFooter />
      <GuestBottomNav isLoggedIn={Boolean(session?.user)} />
    </>
  );
}
