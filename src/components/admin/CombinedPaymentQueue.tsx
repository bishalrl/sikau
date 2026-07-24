"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PaymentQueue } from "@/components/admin/PaymentQueue";

type CoursePayment = Parameters<typeof PaymentQueue>[0]["payments"][number];

type EbookOrderItem = {
  id: string;
  amount: number;
  currency: string;
  receiptPath: string | null;
  notes: string | null;
  ebook: { title: string };
  user: { email: string; name: string | null };
};

export function CombinedPaymentQueue({
  coursePayments,
  ebookOrders,
}: {
  coursePayments: CoursePayment[];
  ebookOrders: EbookOrderItem[];
}) {
  const [items, setItems] = useState(ebookOrders);
  const [message, setMessage] = useState("");

  async function review(orderId: string, status: "APPROVED" | "REJECTED") {
    setMessage("");
    const response = await fetch(`/api/admin/ebook-orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Unable to review ebook order.");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== orderId));
    setMessage(`Ebook order ${status.toLowerCase()} successfully.`);
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="font-headline-md text-on-background">Course payment receipts</h2>
        <PaymentQueue payments={coursePayments} />
      </section>

      <section className="space-y-4">
        <h2 className="font-headline-md text-on-background">Ebook payment receipts</h2>
        {items.map((order) => (
          <div key={order.id} className="rounded-3xl border border-outline-variant/30 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-primary">{order.ebook.title}</p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {order.user.name ?? "Learner"} · {order.user.email}
                </p>
                <p className="mt-1 text-sm text-on-surface-variant">
                  {order.currency} {order.amount.toLocaleString()}
                </p>
              </div>
              {order.receiptPath && (
                <a
                  href={order.receiptPath}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-medium text-primary"
                >
                  View Receipt
                </a>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button type="button" onClick={() => review(order.id, "APPROVED")}>
                Approve
              </Button>
              <Button type="button" variant="outline" onClick={() => review(order.id, "REJECTED")}>
                Reject
              </Button>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-sm text-on-surface-variant">No pending ebook payments.</p>}
        {message && <p className="text-sm text-on-surface-variant">{message}</p>}
      </section>
    </div>
  );
}
