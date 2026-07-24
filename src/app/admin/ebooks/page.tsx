import { EbookManager } from "@/components/admin/EbookManager";
import { getManageableEbooks } from "@/lib/repositories";

export default async function AdminEbooksPage() {
  const ebooks = await getManageableEbooks();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Ebooks</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Upload & Publish Ebooks</h1>
      </div>
      <EbookManager ebooks={ebooks} />
    </section>
  );
}
