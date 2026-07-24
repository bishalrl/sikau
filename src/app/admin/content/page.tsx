import { ContentManager } from "@/components/admin/ContentManager";
import { getWebsiteContent } from "@/lib/repositories";

export default async function AdminContentPage() {
  const records = await getWebsiteContent();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">CMS</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Website Text Control</h1>
      </div>
      <ContentManager records={records} />
    </section>
  );
}
