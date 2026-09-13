import { CmsManager } from "@/components/admin/CmsManager";
import { listCmsRecords } from "@/lib/cms/store";

export default async function AdminContentPage() {
  const records = await listCmsRecords();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Website</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Website content</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Edit the words, photos, menus, and SEO that visitors see. Courses, ebooks, blogs, and the newsletter stay in their own admin pages.
        </p>
      </div>
      <CmsManager records={records} />
    </section>
  );
}
