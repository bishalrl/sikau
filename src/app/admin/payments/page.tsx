import { CombinedPaymentQueue } from "@/components/admin/CombinedPaymentQueue";
import { getPendingEbookOrders, getPendingPayments } from "@/lib/repositories";

export default async function AdminPaymentsPage() {
  const [coursePayments, ebookOrders] = await Promise.all([
    getPendingPayments(),
    getPendingEbookOrders(),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Payments</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Receipt Review Queue</h1>
      </div>
      <CombinedPaymentQueue coursePayments={coursePayments} ebookOrders={ebookOrders} />
    </section>
  );
}
