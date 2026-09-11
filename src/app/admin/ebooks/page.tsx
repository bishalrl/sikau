import { EbookManager } from "@/components/admin/EbookManager";
import { CANONICAL_NEPSE_EBOOK_SLUG, ensureSiteEbooksPublished } from "@/lib/ebooks";
import { getManageableCommunities } from "@/lib/community-repositories";
import { getManageableEbooks } from "@/lib/repositories";

export default async function AdminEbooksPage() {
  await ensureSiteEbooksPublished();
  const [ebooks, communities] = await Promise.all([
    getManageableEbooks(),
    getManageableCommunities(),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Ebooks</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Upload & Publish Ebooks</h1>
        <p className="mt-2 max-w-3xl text-sm text-on-surface-variant">
          Each ebook is its own product with a solo price. Optionally enable a community offer for that
          ebook only. Published ebooks appear on <code>/ebooks</code> and at{" "}
          <code>/ebooks/your-slug</code>.
        </p>
      </div>
      <EbookManager
        ebooks={ebooks}
        communities={communities.map((community) => ({
          id: community.id,
          slug: community.slug,
          name: community.name,
        }))}
        siteEbookSlugs={[CANONICAL_NEPSE_EBOOK_SLUG]}
        siteEbooksFound={ebooks.filter((ebook) => ebook.slug === CANONICAL_NEPSE_EBOOK_SLUG).length}
      />
    </section>
  );
}
