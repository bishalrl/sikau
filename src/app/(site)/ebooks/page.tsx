import NepseEbookLanding from "@/components/ebooks/NepseEbookLanding";
import { PublishedEbooksCatalog } from "@/components/ebooks/PublishedEbooksCatalog";
import { SITE_EBOOK_SLUGS, ensureSiteEbooksPublished } from "@/lib/ebooks";
import {
  getNepseLandingEbookPricing,
  getPublishedEbooks,
} from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function EbooksPage() {
  const session = await getCurrentSession();
  await ensureSiteEbooksPublished();

  const [pricingRows, published] = await Promise.all([
    getNepseLandingEbookPricing(),
    getPublishedEbooks(session?.user.id),
  ]);

  const siteSlugSet = new Set<string>(SITE_EBOOK_SLUGS);
  const extraEbooks = published.filter((ebook) => !siteSlugSet.has(ebook.slug));

  return (
    <>
      <NepseEbookLanding pricingRows={pricingRows} />
      <PublishedEbooksCatalog ebooks={extraEbooks} />
    </>
  );
}
