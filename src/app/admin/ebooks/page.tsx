import { EbookManager } from "@/components/admin/EbookManager";
import { getManageableEbooks } from "@/lib/repositories";

const SITE_EBOOK_SLUGS = ["nepse-trading-guide", "nepse-trading-community"] as const;

export default async function AdminEbooksPage() {
  const ebooks = await getManageableEbooks();
  const siteEbooks = ebooks.filter((ebook) => SITE_EBOOK_SLUGS.includes(ebook.slug as (typeof SITE_EBOOK_SLUGS)[number]));

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Ebooks</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Upload & Publish Ebooks</h1>
        <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
          The live `/ebooks` page is driven by the NEPSE books with slugs `nepse-trading-guide` and
          `nepse-trading-community`. Edit those entries below to update the site.
        </p>
      </div>
      <EbookManager ebooks={ebooks} siteEbookSlugs={[...SITE_EBOOK_SLUGS]} siteEbooksFound={siteEbooks.length} />
    </section>
  );
}
