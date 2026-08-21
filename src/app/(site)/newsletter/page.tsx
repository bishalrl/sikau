import Link from "next/link";
import { NewsletterBuyButton } from "@/components/newsletter/NewsletterBuyButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ensureNewsletterProduct,
  getActiveNewsletterProduct,
  getNewsletterProductForUser,
} from "@/lib/newsletter";
import { getCurrentSession } from "@/lib/session";

export default async function NewsletterPage() {
  const session = await getCurrentSession();

  if (session?.user?.role === "ADMIN") {
    await ensureNewsletterProduct(session.user.id);
  }

  const product = session?.user
    ? await getNewsletterProductForUser(session.user.id)
    : await getActiveNewsletterProduct();

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

  const paymentStatus =
    "paymentStatus" in product ? (product.paymentStatus as string | null) : null;
  const communitySlug = product.community.slug;

  return (
    <div className="site-container py-xl">
      <p className="text-sm font-semibold uppercase tracking-wide text-primary">Main feature</p>
      <h1 className="mt-2 font-display-lg text-display-lg text-on-background">{product.title}</h1>
      <p className="mt-3 max-w-2xl text-lg text-on-surface-variant">{product.description}</p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="p-8">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="emerald">Paid access</Badge>
            {paymentStatus === "APPROVED" && <Badge variant="emerald">Unlocked</Badge>}
            {paymentStatus === "PENDING" && <Badge>Pending approval</Badge>}
          </div>
          <h2 className="mt-4 font-headline-lg text-on-background">What you get</h2>
          <ul className="mt-4 space-y-3 text-on-surface-variant">
            <li>• One private newsletter community group</li>
            <li>• Read all incoming admin updates and older messages</li>
            <li>• Members cannot post — updates only (read-only)</li>
            <li>• Same flow as ebook: login → pay QR → upload receipt → admin approve</li>
          </ul>
          <p className="mt-8 font-display-md text-on-background">
            NPR {product.priceNpr.toLocaleString()}
          </p>
          <div className="mt-6">
            {session?.user ? (
              <NewsletterBuyButton paymentStatus={paymentStatus} communitySlug={communitySlug} />
            ) : (
              <div className="space-y-3">
                <Button href={`/login?callbackUrl=${encodeURIComponent("/newsletter")}`} size="lg">
                  Login to subscribe
                </Button>
                <p className="text-sm text-on-surface-variant">
                  New here?{" "}
                  <Link
                    href={`/signup?callbackUrl=${encodeURIComponent("/newsletter")}`}
                    className="font-semibold text-primary"
                  >
                    Create an account
                  </Link>{" "}
                  first, then complete payment.
                </p>
              </div>
            )}
          </div>
        </Card>

        <Card className="p-8">
          <h2 className="font-headline-md text-on-background">How subscribe works</h2>
          <ol className="mt-4 space-y-4 text-sm text-on-surface-variant">
            <li>
              <strong className="text-on-background">1. Login</strong>
              <br />
              You must have an account — no anonymous subscribe.
            </li>
            <li>
              <strong className="text-on-background">2. Pay via QR</strong>
              <br />
              Scan the bank QR and pay NPR {product.priceNpr.toLocaleString()}.
            </li>
            <li>
              <strong className="text-on-background">3. Upload receipt</strong>
              <br />
              Submit your payment proof for admin review.
            </li>
            <li>
              <strong className="text-on-background">4. Get group access</strong>
              <br />
              After approval, open Community and read newsletter updates.
            </li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
