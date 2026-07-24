import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EbookActionButton } from "@/components/ebooks/EbookActionButton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getEbookBySlug } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

export default async function EbookDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getCurrentSession();
  const { slug } = await params;
  const ebook = await getEbookBySlug(slug, session?.user.id);

  if (!ebook || ebook.status !== "PUBLISHED") {
    notFound();
  }

  const approved = ebook.paymentStatus === "APPROVED" || ebook.isFree;
  const hasContent = Boolean(ebook.content?.trim());

  return (
    <div className="site-container py-xl">
      <Link href="/ebooks" className="text-sm font-medium text-primary">
        ← All ebooks
      </Link>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card className="overflow-hidden">
          <div className="relative h-96 bg-surface-container">
            {ebook.coverImage && (
              <Image src={ebook.coverImage} alt={ebook.title} fill className="object-cover" />
            )}
          </div>
        </Card>

        <Card className="p-8">
          <div className="flex flex-wrap gap-2">
            <Badge variant="emerald">{ebook.isFree ? "Free" : "Paid"}</Badge>
            {ebook.paymentStatus === "PENDING" && <Badge>Pending approval</Badge>}
            {approved && <Badge variant="emerald">Access unlocked</Badge>}
          </div>
          <h1 className="mt-3 font-display-md text-display-md text-on-background">{ebook.title}</h1>
          {ebook.titleNe && <p className="mt-2 text-lg text-primary">{ebook.titleNe}</p>}
          <p className="mt-4 text-on-surface-variant">{ebook.description}</p>
          <p className="mt-6 font-headline-md text-on-background">
            {ebook.isFree ? "Free" : `NPR ${ebook.priceNpr.toLocaleString()}`}
          </p>
          <div className="mt-6 flex max-w-md flex-col gap-3">
            <EbookActionButton
              ebookSlug={ebook.slug}
              isFree={ebook.isFree}
              approved={approved}
              hasContent={hasContent}
              filePath={ebook.filePath}
              size="lg"
            />
            {approved && ebook.filePath && (
              <Button href={ebook.filePath} variant="outline" size="lg">
                Download PDF
              </Button>
            )}
          </div>
          {!ebook.isFree && !approved && (
            <p className="mt-4 text-sm text-on-surface-variant">
              Paid ebooks unlock after QR payment and admin receipt approval.{" "}
              <Link href={`/ebooks/${ebook.slug}/pay`} className="font-medium text-primary">
                Go to payment
              </Link>
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}
