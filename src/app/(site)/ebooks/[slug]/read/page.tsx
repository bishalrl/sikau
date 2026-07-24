import { notFound, redirect } from "next/navigation";
import { EbookPdfReader } from "@/components/ebooks/EbookPdfReader";
import { getEbookBySlug } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";
import { SITE_ASSETS } from "@/lib/site-assets";

function resolveEbookPdf(filePath?: string | null) {
  if (filePath && filePath.toLowerCase().endsWith(".pdf")) {
    // Map packaged public path to the reliable API asset route.
    if (filePath === "/rajuimageandqr/e-book.pdf" || filePath.endsWith("/e-book.pdf")) {
      return SITE_ASSETS.pdf;
    }
    return filePath;
  }
  return SITE_ASSETS.pdf;
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

  const pdfHref = resolveEbookPdf(ebook.filePath);

  return (
    <EbookPdfReader
      title={ebook.title}
      titleNe={ebook.titleNe}
      fileHref={pdfHref}
      backHref={`/ebooks/${ebook.slug}`}
      allowDownload={false}
    />
  );
}
