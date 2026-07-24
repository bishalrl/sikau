import { notFound, redirect } from "next/navigation";
import { EbookPdfReader } from "@/components/ebooks/EbookPdfReader";
import { EbookReader } from "@/components/ebooks/EbookReader";
import { getEbookBySlug } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

function isPdf(filePath?: string | null) {
  return Boolean(filePath && filePath.toLowerCase().endsWith(".pdf"));
}

export default async function EbookReadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getCurrentSession();
  const { slug } = await params;

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/ebooks/${slug}/read`)}`);
  }

  const ebook = await getEbookBySlug(slug, session.user.id);
  if (!ebook || ebook.status !== "PUBLISHED") {
    notFound();
  }

  const unlocked = ebook.isFree || ebook.paymentStatus === "APPROVED";
  if (!unlocked) {
    redirect(`/ebooks/${ebook.slug}/pay`);
  }

  if (isPdf(ebook.filePath)) {
    return (
      <EbookPdfReader
        title={ebook.title}
        titleNe={ebook.titleNe}
        fileHref={ebook.filePath as string}
        backHref={`/ebooks/${ebook.slug}`}
        allowDownload={false}
      />
    );
  }

  return (
    <EbookReader
      title={ebook.title}
      titleNe={ebook.titleNe}
      content={ebook.content ?? ""}
      backHref={`/ebooks/${ebook.slug}`}
      downloadHref={ebook.filePath}
    />
  );
}
