import { ReviewsManager } from "@/components/admin/ReviewsManager";
import { prisma } from "@/lib/prisma";

export default async function AdminReviewsPage() {
  const reviews = await prisma.review.findMany({
    orderBy: [{ published: "desc" }, { createdAt: "desc" }],
    take: 200,
  });

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Feedback</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Reviews</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Submissions from <code className="text-primary">/review</code>. Published ones appear on the homepage.
        </p>
      </div>
      <ReviewsManager
        reviews={reviews.map((review) => ({
          ...review,
          createdAt: review.createdAt.toISOString(),
        }))}
      />
    </section>
  );
}
