import { CmsManager } from "@/components/admin/CmsManager";
import { listCmsRecords } from "@/lib/cms/store";
import { prisma } from "@/lib/prisma";

export default async function AdminContentPage() {
  const [records, courses, ebooks] = await Promise.all([
    listCmsRecords(),
    prisma.course
      .findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, title: true, priceNpr: true },
        orderBy: { title: "asc" },
      })
      .catch(() => []),
    prisma.ebook
      .findMany({
        where: { status: "PUBLISHED", NOT: { slug: "nepse-trading-community" } },
        select: { slug: true, title: true, priceNpr: true, isFree: true },
        orderBy: { title: "asc" },
      })
      .catch(() => []),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Website</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Website content</h1>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Edit homepage promotions, menus, photos, and SEO. Under Homepage, open Featured course and Featured
          ebook to choose what visitors see.
        </p>
      </div>
      <CmsManager
        records={records}
        courseOptions={courses.map((course) => ({
          value: course.slug,
          label: `${course.title} · ${course.priceNpr <= 0 ? "Free" : `NPR ${course.priceNpr}`}`,
        }))}
        ebookOptions={ebooks.map((ebook) => ({
          value: ebook.slug,
          label: `${ebook.title} · ${ebook.isFree || ebook.priceNpr <= 0 ? "Free" : `NPR ${ebook.priceNpr}`}`,
        }))}
      />
    </section>
  );
}
