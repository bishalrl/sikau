import { Card } from "@/components/ui/Card";
import { prisma } from "@/lib/prisma";

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Course",
  NEWSLETTER: "Newsletter",
  EBOOK: "E-book",
};

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Feedback</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Reviews</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Submissions from the public form at <code className="text-primary">/review</code>
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-outline-variant/30 px-5 py-4">
          <p className="text-sm font-semibold text-on-background">
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </p>
        </div>

        {reviews.length === 0 ? (
          <p className="px-5 py-8 text-sm text-on-surface-variant">No reviews yet.</p>
        ) : (
          <ul className="divide-y divide-outline-variant/20">
            {reviews.map((review) => (
              <li key={review.id} className="px-5 py-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-on-background">{review.name}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      {TYPE_LABEL[review.type] ?? review.type}
                    </p>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {new Date(review.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-on-surface-variant">{review.body}</p>
                {review.imagePath && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={review.imagePath}
                    alt={`${review.name} photo`}
                    className="mt-4 max-h-56 rounded-xl border border-outline-variant/30 object-contain"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
