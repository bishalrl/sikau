import Link from "next/link";
import { redirect } from "next/navigation";
import { NewsletterReceiptForm } from "@/components/newsletter/NewsletterReceiptForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ensureNewsletterProduct, getNewsletterProductForUser } from "@/lib/newsletter";
import { getCurrentSession } from "@/lib/session";
import { SITE_ASSETS } from "@/lib/site-assets";

export default async function NewsletterPayPage() {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent("/newsletter/pay")}`);
  }

  await ensureNewsletterProduct(session.user.role === "ADMIN" ? session.user.id : undefined);
  const product = await getNewsletterProductForUser(session.user.id);

  if (!product) {
    redirect("/newsletter");
  }

  if (product.paymentStatus === "APPROVED") {
    redirect(`/community/${product.community.slug}`);
  }

  return (
    <div className="site-container py-xl">
      <Link href="/newsletter" className="text-sm font-medium text-primary">
        ← Back to newsletter
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Newsletter Payment</p>
            <Badge variant="emerald">
              {product.paymentStatus === "REJECTED"
                ? "Rejected — re-upload"
                : product.order?.receiptPath
                  ? "Awaiting approval"
                  : "Pay, then upload receipt"}
            </Badge>
          </div>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">{product.title}</h1>
          <p className="mt-2 text-on-surface-variant">
            {product.paymentInstructions ?? "Scan the QR, pay, then upload your receipt for unlock."}
          </p>
          <div className="mt-6 rounded-3xl border border-dashed border-outline-variant/50 bg-surface-container-low p-4 text-center sm:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.paymentQrPath || SITE_ASSETS.qr}
              alt={`${product.title} payment QR`}
              className="mx-auto aspect-square w-full max-w-[min(18rem,100%)] rounded-2xl bg-white object-contain p-3"
            />
            <p className="mt-4 text-sm text-on-surface-variant">
              Scan this bank QR, pay NPR {product.priceNpr.toLocaleString()}, then upload your receipt.
            </p>
          </div>
          <p className="mt-4 font-headline-md text-on-background">
            NPR {product.priceNpr.toLocaleString()}
          </p>
        </Card>

        <NewsletterReceiptForm />
      </div>
    </div>
  );
}
