import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export type PublishedEbookCard = {
  id: string;
  slug: string;
  title: string;
  titleNe: string | null;
  description: string;
  coverImage: string | null;
  priceNpr: number;
  isFree: boolean;
  paymentStatus: string | null;
};

type Props = {
  ebooks: PublishedEbookCard[];
};

export function PublishedEbooksCatalog({ ebooks }: Props) {
  if (ebooks.length === 0) return null;

  return (
    <section className="border-t border-outline-variant/30 bg-surface py-xl">
      <div className="site-container">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">More ebooks</p>
        <h2 className="mt-2 font-display-md text-display-md text-on-background">Published library</h2>
        <p className="mt-2 max-w-2xl text-on-surface-variant">
          Additional ebooks published from the admin portal.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ebooks.map((ebook) => (
            <Card key={ebook.id} className="flex h-full flex-col overflow-hidden">
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
                  <Badge variant="emerald">{ebook.isFree ? "Free" : "Paid"}</Badge>
                  {ebook.paymentStatus === "APPROVED" && <Badge variant="emerald">Unlocked</Badge>}
                </div>
                <h3 className="mt-3 font-headline-md text-on-background">{ebook.title}</h3>
                {ebook.titleNe && <p className="mt-1 text-sm text-primary">{ebook.titleNe}</p>}
                <p className="mt-2 line-clamp-3 text-sm text-on-surface-variant">{ebook.description}</p>
                <p className="mt-4 font-semibold text-on-background">
                  {ebook.isFree ? "Free" : `NPR ${ebook.priceNpr.toLocaleString()}`}
                </p>
                <Button href={`/ebooks/${ebook.slug}`} className="mt-auto pt-4" size="sm">
                  View ebook
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
