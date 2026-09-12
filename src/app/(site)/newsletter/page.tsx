import NepseWeeklyLanding from "@/components/newsletter/NepseWeeklyLanding";
import { Card } from "@/components/ui/Card";
import {
  ensureNewsletterProduct,
  getActiveNewsletterProduct,
  getNewsletterProductForUser,
} from "@/lib/newsletter";
import { getCurrentSession } from "@/lib/session";

export default async function NewsletterPage() {
  const session = await getCurrentSession();

  try {
    if (session?.user?.role === "ADMIN") {
      await ensureNewsletterProduct(session.user.id);
    }

    const product = session?.user
      ? await getNewsletterProductForUser(session.user.id)
      : await getActiveNewsletterProduct();

    if (!product) {
      return (
        <div className="site-container py-xl">
          <Card className="p-8">
            <h1 className="font-display-md text-on-background">NEPSE Weekly</h1>
            <p className="mt-2 text-on-surface-variant">The newsletter is not available yet.</p>
          </Card>
        </div>
      );
    }

    const paymentStatus =
      "paymentStatus" in product ? (product.paymentStatus as string | null) : null;

    return (
      <NepseWeeklyLanding
        paymentStatus={paymentStatus}
        communitySlug={product.community.slug}
        plans={product.plans ?? []}
        isLoggedIn={Boolean(session?.user)}
        coverImage={product.coverImage}
        samplePdfPath={product.samplePdfPath}
        previewImages={(() => {
          try {
            const parsed = JSON.parse(product.previewImagesJson || "[]") as unknown;
            return Array.isArray(parsed) ? parsed.map(String) : [];
          } catch {
            return [];
          }
        })()}
      />
    );
  } catch (error) {
    console.error("Newsletter page failed:", error);
    return (
      <div className="site-container py-xl">
        <Card className="p-8">
          <h1 className="font-display-md text-on-background">NEPSE Weekly</h1>
          <p className="mt-2 text-on-surface-variant">
            Newsletter is temporarily unavailable. If you just deployed, run{" "}
            <code>npx prisma db push</code> on the server, then restart the app.
          </p>
        </Card>
      </div>
    );
  }
}
