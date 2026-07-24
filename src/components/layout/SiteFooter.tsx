import { getWebsiteContentMap } from "@/lib/repositories";
import { AppFooter } from "./AppFooter";

export async function SiteFooter() {
  const content = await getWebsiteContentMap();
  return <AppFooter variant="light" description={content["site.footer.description"]?.markdown} />;
}
