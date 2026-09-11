import { EbookLibrary } from "@/components/ebooks/EbookLibrary";
import { ensureSiteEbooksPublished } from "@/lib/ebooks";
import { getPublishedEbooks } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function EbooksPage() {
  const session = await getCurrentSession();
  await ensureSiteEbooksPublished();
  const ebooks = await getPublishedEbooks(session?.user.id);

  return (
    <EbookLibrary
      ebooks={ebooks.map((ebook) => ({
        id: ebook.id,
        slug: ebook.slug,
        title: ebook.title,
        titleNe: ebook.titleNe,
        description: ebook.description,
        coverImage: ebook.coverImage,
        priceNpr: ebook.priceNpr,
        isFree: ebook.isFree,
        communityOfferEnabled: Boolean(
          "communityOfferEnabled" in ebook ? ebook.communityOfferEnabled : false,
        ),
        communityOfferName:
          "communityOfferName" in ebook ? (ebook.communityOfferName as string | null) : null,
        communityOfferPriceNpr:
          "communityOfferPriceNpr" in ebook
            ? (ebook.communityOfferPriceNpr as number | null)
            : null,
        paymentStatus: ebook.paymentStatus,
      }))}
    />
  );
}
