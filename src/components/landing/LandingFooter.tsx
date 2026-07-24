import { getWebsiteContentMap } from "@/lib/repositories";
import { AppFooter } from "@/components/layout/AppFooter";

export async function LandingFooter() {
  const content = await getWebsiteContentMap();
  return <AppFooter variant="dark" description={content["site.footer.description"]?.markdown} />;
}
