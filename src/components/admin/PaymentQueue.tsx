"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type PaymentItem = {
  id: string;
  amount: number;
  currency: string;
  receiptPath: string | null;
  notes: string | null;
  enrollment: {
    course: { title: string };
    user: { email: string; name: string | null };
  };
};

export function PaymentQueue({ payments }: { payments: PaymentItem[] }) {
  const [items, setItems] = useState(payments);
  const [message, setMessage] = useState("");

  async function review(paymentId: string, status: "APPROVED" | "REJECTED") {
    setMessage("");
    const response = await fetch(`/api/admin/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Unable to review payment.");
      return;
    }

    setItems((current) => current.filter((item) => item.id !== paymentId));
    setMessage(`Payment ${status.toLowerCase()} successfully.`);
  }

  return (
    <div className="space-y-4">
      {items.map((payment) => (
        <div key={payment.id} className="rounded-3xl border border-outline-variant/30 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-primary">{payment.enrollment.course.title}</p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {payment.enrollment.user.name ?? "Learner"} · {payment.enrollment.user.email}
              </p>
              <p className="mt-1 text-sm text-on-surface-variant">
                {payment.currency} {payment.amount.toLocaleString()}
              </p>
              {payment.notes && <p className="mt-2 text-sm text-on-surface-variant">{payment.notes}</p>}
            </div>
            {payment.receiptPath && (
              <a
                href={payment.receiptPath}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-medium text-primary"
              >
                View Receipt
              </a>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" onClick={() => review(payment.id, "APPROVED")}>
              Approve
            </Button>
            <Button type="button" variant="outline" onClick={() => review(payment.id, "REJECTED")}>
              Reject
            </Button>
          </div>
        </div>
      ))}

      {items.length === 0 && <p className="text-sm text-on-surface-variant">No pending payments.</p>}
      {message && <p className="text-sm text-on-surface-variant">{message}</p>}
    </div>
  );
}
