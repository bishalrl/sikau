import { getPublicCms } from "@/lib/cms/public";
import { AppFooter } from "./AppFooter";

export async function SiteFooter() {
  const cms = await getPublicCms();
  return (
    <AppFooter
      variant="light"
      siteName={cms.site.name}
      description={cms.site.footerDescription}
      copyrightName={cms.site.copyrightName}
      quickHeading={cms.footerQuick.heading}
      quickLinks={cms.footerQuick.links}
      resourceHeading={cms.footerResources.heading}
      resourceLinks={cms.footerResources.links}
      legalLinks={cms.footerLegal}
      socialLinks={cms.social}
      newsletterHeading={cms.footerNewsletterHeading}
    />
  );
}
