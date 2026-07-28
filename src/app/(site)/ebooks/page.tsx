import NepseEbookLanding from "@/components/ebooks/NepseEbookLanding";
import { getNepseLandingEbookPricing } from "@/lib/repositories";

export default async function EbooksPage() {
  const pricingRows = await getNepseLandingEbookPricing();
  return <NepseEbookLanding pricingRows={pricingRows} />;
}
