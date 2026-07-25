import Link from "next/link";
import { redirect } from "next/navigation";
import { CommunityList } from "@/components/community/CommunityList";
import { getCurrentSession } from "@/lib/session";

export default async function CommunityPage() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/community");
  }

  return (
    <div className="site-container py-xl">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Community</p>
          <h1 className="mt-2 font-display-md text-display-md text-on-background">Your groups</h1>
          <p className="mt-2 text-sm text-on-surface-variant">
            Chat with fellow traders in communities unlocked by your package.
          </p>
        </div>
        <Link href="/ebooks#packages" className="text-sm font-semibold text-primary">
          Browse packages
        </Link>
      </div>
      <CommunityList />
    </div>
  );
}
