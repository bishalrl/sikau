import { EbookManager } from "@/components/admin/EbookManager";
import { SITE_EBOOK_SLUGS, ensureSiteEbooksPublished } from "@/lib/ebooks";
import { getManageableEbooks } from "@/lib/repositories";

export default async function AdminEbooksPage() {
  await ensureSiteEbooksPublished();
  const ebooks = await getManageableEbooks();
  const siteEbooks = ebooks.filter((ebook) =>
    SITE_EBOOK_SLUGS.includes(ebook.slug as (typeof SITE_EBOOK_SLUGS)[number]),
  );

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Ebooks</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Upload & Publish Ebooks</h1>
        <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
          NEPSE packages (`nepse-trading-guide`, `nepse-trading-community`) power the main `/ebooks`
          sales page and stay <strong>Published</strong> automatically. Other ebooks need status
          Published to appear in the library and at `/ebooks/your-slug`.
        </p>
      </div>
      <EbookManager ebooks={ebooks} siteEbookSlugs={[...SITE_EBOOK_SLUGS]} siteEbooksFound={siteEbooks.length} />
    </section>
  );
}
