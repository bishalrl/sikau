"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type NewsletterOrderItem = {
  id: string;
  amount: number;
  currency: string;
  receiptPath: string | null;
  notes: string | null;
  product: { title: string };
  user: { email: string; name: string | null };
};

export function NewsletterPaymentQueue({ orders }: { orders: NewsletterOrderItem[] }) {
  const [items, setItems] = useState(orders);
  const [message, setMessage] = useState("");

  async function review(orderId: string, status: "APPROVED" | "REJECTED") {
    setMessage("");
    const response = await fetch(`/api/admin/newsletter-orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Unable to review newsletter order.");
      return;
    }
    setItems((current) => current.filter((item) => item.id !== orderId));
    setMessage(`Newsletter order ${status.toLowerCase()} successfully.`);
  }

  return (
    <section className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6">
      <h2 className="font-headline-md text-on-background">Newsletter payment receipts</h2>
      {items.map((order) => (
        <div key={order.id} className="rounded-2xl border border-outline-variant/30 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">{order.product.title}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {order.user.name ?? "Learner"} · {order.user.email}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {order.currency} {order.amount.toLocaleString()}
              </p>
              {order.notes && <p className="mt-2 text-sm text-on-surface-variant">{order.notes}</p>}
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
            <Button type="button" onClick={() => void review(order.id, "APPROVED")}>
              Approve
            </Button>
            <Button type="button" variant="outline" onClick={() => void review(order.id, "REJECTED")}>
              Reject
            </Button>
          </div>
        </div>
      ))}
      {items.length === 0 && <p className="text-sm text-on-surface-variant">No pending newsletter payments.</p>}
      {message && <p className="text-sm text-on-surface-variant">{message}</p>}
    </section>
  );
}
