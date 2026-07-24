import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EbookReceiptForm } from "@/components/ebooks/EbookReceiptForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { getEbookBySlug } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";
import { SITE_ASSETS } from "@/lib/site-assets";

export default async function EbookPayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getCurrentSession();
  const { slug } = await params;

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/ebooks/${slug}/pay`)}`);
  }

  const ebook = await getEbookBySlug(slug, session.user.id);
  if (!ebook || ebook.status !== "PUBLISHED") {
    notFound();
  }

  if (ebook.isFree || ebook.paymentStatus === "APPROVED") {
    redirect(`/ebooks/${ebook.slug}`);
  }

  return (
    <div className="site-container py-xl">
      <Link href={`/ebooks/${ebook.slug}`} className="text-sm font-medium text-primary">
        ← Back to ebook
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Ebook Payment</p>
            <Badge variant="emerald">
              {ebook.paymentStatus === "REJECTED" ? "Rejected — re-upload" : "Awaiting approval"}
            </Badge>
          </div>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">{ebook.title}</h1>
          <p className="mt-2 text-on-surface-variant">
            {ebook.paymentInstructions ?? "Scan the QR, pay, then upload your receipt for unlock."}
          </p>
          <div className="mt-6 rounded-3xl border border-dashed border-outline-variant/50 bg-surface-container-low p-8 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ebook.paymentQrPath || SITE_ASSETS.qr}
              alt={`${ebook.title} payment QR`}
              className="mx-auto h-72 w-72 rounded-2xl bg-white object-contain p-3"
            />
            <p className="mt-4 text-sm text-on-surface-variant">
              Scan this bank QR, pay NPR {ebook.priceNpr.toLocaleString()}, then upload your receipt.
            </p>
          </div>
          <p className="mt-4 font-headline-md text-on-background">
            NPR {ebook.priceNpr.toLocaleString()}
          </p>
        </Card>

        <EbookReceiptForm ebookSlug={ebook.slug} />
      </div>
    </div>
  );
}
