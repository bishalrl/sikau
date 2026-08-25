import { Card } from "@/components/ui/Card";
import { NewsletterGroupControl } from "@/components/admin/NewsletterGroupControl";
import { NewsletterPaymentQueue } from "@/components/admin/NewsletterPaymentQueue";
import { NewsletterProductForm } from "@/components/admin/NewsletterProductForm";
import { ensureNewsletterProduct } from "@/lib/newsletter";
import {
  getNewsletterSubscribers,
  getPendingNewsletterOrders,
  type NewsletterSubscriberRow,
} from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminNewsletterPage() {
  const session = await getCurrentSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const [product, subscribers, pendingOrders] = await Promise.all([
    ensureNewsletterProduct(session.user.id),
    getNewsletterSubscribers(),
    getPendingNewsletterOrders(),
  ]);

  return (
    <section className="space-y-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Audience</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Newsletter</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Set price &amp; QR, <strong>post messages to the paid group</strong>, approve receipts, and
          view free email leads.
        </p>
      </div>

      <NewsletterProductForm
        initial={{
          id: product.id,
          title: product.title,
          description: product.description,
          priceNpr: product.priceNpr,
          paymentQrPath: product.paymentQrPath,
          paymentInstructions: product.paymentInstructions,
          isActive: product.isActive,
          community: {
            id: product.community.id,
            slug: product.community.slug,
            name: product.community.name,
          },
          plans: product.plans.map((plan) => ({
            id: plan.id,
            code: plan.code,
            label: plan.label,
            priceNpr: plan.priceNpr,
            listPriceNpr: plan.listPriceNpr,
            discountPercent: plan.discountPercent,
            perDayNpr: plan.perDayNpr,
            badge: plan.badge,
            sortOrder: plan.sortOrder,
            isActive: plan.isActive,
          })),
        }}
      />

      <NewsletterGroupControl
        communityId={product.communityId}
        communityName={product.community.name}
        communitySlug={product.community.slug}
      />

      <NewsletterPaymentQueue orders={pendingOrders} />

      <Card className="overflow-hidden p-0">
        <div className="border-b border-outline-variant/30 px-5 py-4">
          <p className="text-sm font-semibold text-on-background">
            Free email leads · {subscribers.length} subscriber{subscribers.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-xs text-on-surface-variant">
            Emails from the site footer form (separate from paid group access).
          </p>
        </div>

        {subscribers.length === 0 ? (
          <p className="px-5 py-8 text-sm text-on-surface-variant">No newsletter email leads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-surface-container-low text-on-surface-variant">
                <tr>
                  <th className="px-5 py-3 font-semibold">Email</th>
                  <th className="px-5 py-3 font-semibold">Source</th>
                  <th className="px-5 py-3 font-semibold">Subscribed</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber: NewsletterSubscriberRow) => (
                  <tr key={subscriber.id} className="border-t border-outline-variant/20">
                    <td className="px-5 py-3 font-medium text-on-background">{subscriber.email}</td>
                    <td className="px-5 py-3 text-on-surface-variant">{subscriber.source}</td>
                    <td className="px-5 py-3 text-on-surface-variant">
                      {new Date(subscriber.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
