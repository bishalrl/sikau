import Link from "next/link";
import { CmsImage } from "@/components/cms/CmsImage";

export type HomeReview = {
  id: string;
  name: string;
  body: string;
  type: string;
  imagePath: string | null;
};

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Course",
  NEWSLETTER: "Newsletter",
  EBOOK: "E-book",
};

type Props = {
  title?: string;
  description?: string;
  reviews: HomeReview[];
};

export function HomepageReviewsSection({ title, description, reviews }: Props) {
  if (!reviews.length) return null;

  return (
    <section className="overflow-hidden bg-surface-container-low py-xl" id="reviews">
      <div className="site-container">
        <div className="reveal active mb-xl text-center">
          <h2 className="font-display-md text-display-md text-on-background">
            {title || "What learners say"}
          </h2>
          <p className="mt-sm text-on-surface-variant">
            {description || "Real feedback from people who joined Sikau Paisa."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
          {reviews.map((review, index) => (
            <article
              key={review.id}
              className={`reveal active flex h-full flex-col rounded-3xl bg-white p-lg shadow-lg ${
                index % 3 === 1 ? "delay-100" : index % 3 === 2 ? "delay-200" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-sm">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {review.imagePath ? (
                      <CmsImage
                        src={review.imagePath}
                        alt={review.name}
                        width={48}
                        height={48}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      review.name.slice(0, 1).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="truncate font-label-md">{review.name}</h4>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {TYPE_LABEL[review.type] ?? review.type}
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-md flex-1 text-sm leading-6 text-on-surface-variant">
                &quot;{review.body}&quot;
              </p>
              {review.imagePath && (
                <div className="relative mt-md aspect-[16/10] overflow-hidden rounded-2xl bg-surface-container">
                  <CmsImage src={review.imagePath} alt="" fill className="object-cover" />
                </div>
              )}
            </article>
          ))}
        </div>

        <div className="mt-xl text-center">
          <Link href="/review" className="text-sm font-semibold text-primary hover:underline">
            Share your review
          </Link>
        </div>
      </div>
    </section>
  );
}
