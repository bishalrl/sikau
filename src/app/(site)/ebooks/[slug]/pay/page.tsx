import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EbookReceiptForm } from "@/components/ebooks/EbookReceiptForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ebookHasCommunityOffer, resolvePurchaseAmount } from "@/lib/ebook-offer";
import { LEGACY_NEPSE_BUNDLE_SLUG, CANONICAL_NEPSE_EBOOK_SLUG } from "@/lib/ebooks";
import { getEbookBySlug } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";
import { SITE_ASSETS } from "@/lib/site-assets";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string }>;
};

export default async function EbookPayPage({ params, searchParams }: Props) {
  const session = await getCurrentSession();
  const { slug } = await params;
  const query = await searchParams;

  if (slug === LEGACY_NEPSE_BUNDLE_SLUG) {
    redirect(`/ebooks/${CANONICAL_NEPSE_EBOOK_SLUG}/pay?type=community`);
  }

  if (!session?.user) {
    const callback = `/ebooks/${slug}/pay${query.type ? `?type=${encodeURIComponent(query.type)}` : ""}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }

  const ebook = await getEbookBySlug(slug, session.user.id);
  if (!ebook || ebook.status !== "PUBLISHED") {
    notFound();
  }

  const wantsCommunity = (query.type ?? "").toLowerCase() === "community";
  const purchaseType =
    wantsCommunity && ebookHasCommunityOffer(ebook as never)
      ? "COMMUNITY_BUNDLE"
      : "SOLO_EBOOK";

  if (
    ebook.paymentStatus === "APPROVED" &&
    (purchaseType === "SOLO_EBOOK" || ebook.purchaseType === "COMMUNITY_BUNDLE")
  ) {
    redirect(`/ebooks/${ebook.slug}/read`);
  }

  // Free solo ebooks never use the payment page — unlock and open reader.
  if ((ebook.isFree || ebook.priceNpr <= 0) && purchaseType === "SOLO_EBOOK") {
    redirect(`/ebooks/${ebook.slug}/read`);
  }

  const amount = resolvePurchaseAmount(ebook as never, purchaseType);
  const offerLabel =
    purchaseType === "COMMUNITY_BUNDLE"
      ? `Ebook + ${ebook.communityOfferName ?? "Community"}`
      : "Ebook Only";

  return (
    <div className="site-container py-xl">
      <Link href={`/ebooks/${ebook.slug}#access`} className="text-sm font-medium text-primary">
        ← Back to {ebook.title}
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">Ebook Payment</p>
            <Badge variant="emerald">
              {ebook.paymentStatus === "REJECTED"
                ? "Rejected — re-upload"
                : ebook.order?.receiptPath
                  ? "Awaiting approval"
                  : "Pay, then upload receipt"}
            </Badge>
          </div>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">{ebook.title}</h1>
          <p className="mt-2 text-on-surface-variant">
            Plan: <strong className="text-on-background">{offerLabel}</strong>
          </p>
          <p className="mt-2 text-on-surface-variant">
            {ebook.paymentInstructions ?? "Scan the QR, pay, then upload your receipt for unlock."}
          </p>
          <div className="mt-6 rounded-3xl border border-dashed border-outline-variant/50 bg-surface-container-low p-4 text-center sm:p-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ebook.paymentQrPath || SITE_ASSETS.qr}
              alt={`${ebook.title} payment QR`}
              className="mx-auto aspect-square w-full max-w-[min(18rem,100%)] rounded-2xl bg-white object-contain p-3"
            />
            <p className="mt-4 text-sm text-on-surface-variant">
              Scan this bank QR, pay NPR {amount.toLocaleString()}, then upload your receipt.
            </p>
          </div>
          <p className="mt-4 font-headline-md text-on-background">
            NPR {amount.toLocaleString()}
            <span className="ml-2 text-sm font-normal text-on-surface-variant">· {offerLabel}</span>
          </p>
        </Card>

        <EbookReceiptForm ebookSlug={ebook.slug} purchaseType={purchaseType} />
      </div>
    </div>
  );
}
