import Link from "next/link";
import { redirect } from "next/navigation";
import { NewsletterBuyButton } from "@/components/newsletter/NewsletterBuyButton";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ensureNewsletterProduct, getNewsletterProductForUser } from "@/lib/newsletter";
import { getCurrentSession } from "@/lib/session";

export default async function NewsletterPage() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/newsletter")}`);
  }

  await ensureNewsletterProduct(session.user.role === "ADMIN" ? session.user.id : undefined);
  const product = await getNewsletterProductForUser(session.user.id);

  if (!product) {
    return (
      <div className="site-container py-xl">
        <Card className="p-8">
          <h1 className="font-display-md text-on-background">Newsletter</h1>
          <p className="mt-2 text-on-surface-variant">The paid newsletter is not available yet.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="site-container py-xl">
      <Link href="/community" className="text-sm font-medium text-primary">
        ← Community
      </Link>

      <Card className="mt-6 max-w-3xl p-8">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Paid newsletter</p>
          {product.paymentStatus === "APPROVED" && <Badge variant="emerald">Unlocked</Badge>}
          {product.paymentStatus === "PENDING" && <Badge variant="emerald">Pending approval</Badge>}
        </div>
        <h1 className="mt-3 font-display-md text-display-md text-on-background">{product.title}</h1>
        <p className="mt-3 text-on-surface-variant">{product.description}</p>
        <ul className="mt-6 space-y-2 text-sm text-on-surface-variant">
          <li>• Access one private community group</li>
          <li>• Read all incoming updates and older messages</li>
          <li>• Members cannot post — updates only</li>
        </ul>
        <p className="mt-6 font-headline-md text-on-background">
          NPR {product.priceNpr.toLocaleString()}
        </p>
        <div className="mt-6">
          <NewsletterBuyButton
            paymentStatus={product.paymentStatus}
            communitySlug={product.community.slug}
          />
        </div>
      </Card>
    </div>
  );
}
