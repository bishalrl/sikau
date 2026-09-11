import { notFound, redirect } from "next/navigation";
import { EbookProductDetail } from "@/components/ebooks/EbookProductDetail";
import {
  LEGACY_NEPSE_BUNDLE_SLUG,
  CANONICAL_NEPSE_EBOOK_SLUG,
  ensureSiteEbooksPublished,
} from "@/lib/ebooks";
import { getEbookBySlug } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function EbookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getCurrentSession();
  const { slug } = await params;

  if (slug === LEGACY_NEPSE_BUNDLE_SLUG) {
    redirect(`/ebooks/${CANONICAL_NEPSE_EBOOK_SLUG}?type=community#access`);
  }

  await ensureSiteEbooksPublished();
  const ebook = await getEbookBySlug(slug, session?.user.id);

  if (!ebook || ebook.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <EbookProductDetail
      ebook={{
        slug: ebook.slug,
        title: ebook.title,
        titleNe: ebook.titleNe,
        headline: "headline" in ebook ? (ebook.headline as string | null) : null,
        description: ebook.description,
        coverImage: ebook.coverImage,
        priceNpr: ebook.priceNpr,
        isFree: ebook.isFree,
        curriculumJson: "curriculumJson" in ebook ? String(ebook.curriculumJson ?? "[]") : "[]",
        audienceJson: "audienceJson" in ebook ? String(ebook.audienceJson ?? "[]") : "[]",
        communityOfferEnabled: Boolean(
          "communityOfferEnabled" in ebook ? ebook.communityOfferEnabled : false,
        ),
        communityOfferName:
          "communityOfferName" in ebook ? (ebook.communityOfferName as string | null) : null,
        communityOfferPriceNpr:
          "communityOfferPriceNpr" in ebook
            ? (ebook.communityOfferPriceNpr as number | null)
            : null,
        communityAccessType:
          "communityAccessType" in ebook ? (ebook.communityAccessType as string | null) : null,
        communityBenefitsJson:
          "communityBenefitsJson" in ebook
            ? String(ebook.communityBenefitsJson ?? "[]")
            : "[]",
        paymentStatus: ebook.paymentStatus,
        purchaseType: "purchaseType" in ebook ? (ebook.purchaseType as string | null) : null,
        community: "community" in ebook ? (ebook.community as { id: string; slug: string; name: string } | null) : null,
      }}
    />
  );
}
