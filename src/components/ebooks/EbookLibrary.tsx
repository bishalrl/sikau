import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { fromPriceLabel } from "@/lib/ebook-offer";

export type EbookLibraryCard = {
  id: string;
  slug: string;
  title: string;
  titleNe: string | null;
  description: string;
  coverImage: string | null;
  priceNpr: number;
  isFree: boolean;
  communityOfferEnabled: boolean;
  communityOfferName: string | null;
  communityOfferPriceNpr: number | null;
  paymentStatus: string | null;
};

type Props = {
  ebooks: EbookLibraryCard[];
};

export function EbookLibrary({ ebooks }: Props) {
  if (ebooks.length === 0) {
    return (
      <div className="site-container py-xl">
        <Card className="p-8">
          <h1 className="font-display-md text-on-background">Ebooks</h1>
          <p className="mt-2 text-on-surface-variant">No published ebooks yet.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="nepse-landing">
      <section className="nepse-section" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div className="site-container">
          <div className="nepse-section__intro">
            <p className="nepse-eyebrow">Ebook library</p>
            <h1 className="nepse-heading">Learn money, markets &amp; trading</h1>
            <p className="nepse-lead">
              Choose an ebook. Each product has its own price — and some include an optional community offer.
            </p>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {ebooks.map((ebook) => (
              <Card key={ebook.id} className="flex h-full flex-col overflow-hidden bg-white/90">
                <div className="relative aspect-[4/3] bg-surface-container">
                  {ebook.coverImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ebook.coverImage}
                      alt={ebook.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-on-surface-variant">
                      No cover
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="emerald">
                      {ebook.isFree || ebook.priceNpr <= 0 ? "Free" : "Paid"}
                    </Badge>
                    {ebook.communityOfferEnabled && <Badge>Community offer</Badge>}
                    {ebook.paymentStatus === "APPROVED" && <Badge variant="emerald">Unlocked</Badge>}
                  </div>
                  <h2 className="mt-3 font-headline-md text-on-background">{ebook.title}</h2>
                  {ebook.titleNe && <p className="mt-1 text-sm text-primary">{ebook.titleNe}</p>}
                  <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant">{ebook.description}</p>
                  <p className="mt-4 font-semibold text-on-background">{fromPriceLabel(ebook)}</p>
                  <Button href={`/ebooks/${ebook.slug}`} className="mt-auto pt-4" size="sm">
                    View Ebook
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
