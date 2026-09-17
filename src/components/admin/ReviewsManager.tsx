"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

type ReviewRow = {
  id: string;
  name: string;
  body: string;
  type: string;
  imagePath: string | null;
  published: boolean;
  createdAt: string | Date;
};

const TYPE_LABEL: Record<string, string> = {
  COURSE: "Course",
  NEWSLETTER: "Newsletter",
  EBOOK: "E-book",
};

export function ReviewsManager({ reviews: initial }: { reviews: ReviewRow[] }) {
  const router = useRouter();
  const [reviews, setReviews] = useState(initial);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  async function setPublished(id: string, published: boolean) {
    setBusyId(id);
    setMessage("");
    const response = await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    const data = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      setMessage(data.error ?? "Unable to update review.");
      return;
    }
    setReviews((current) => current.map((item) => (item.id === id ? { ...item, published } : item)));
    setMessage(published ? "Shown on the homepage." : "Hidden from the homepage.");
    router.refresh();
  }

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete review from ${name}?`)) return;
    setBusyId(id);
    setMessage("");
    const response = await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    const data = await response.json().catch(() => ({}));
    setBusyId(null);
    if (!response.ok) {
      setMessage(data.error ?? "Unable to delete review.");
      return;
    }
    setReviews((current) => current.filter((item) => item.id !== id));
    setMessage("Review deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {message && <p className="rounded-2xl bg-primary-container/15 px-4 py-3 text-sm">{message}</p>}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-outline-variant/30 px-5 py-4">
          <p className="text-sm font-semibold text-on-background">
            {reviews.length} review{reviews.length === 1 ? "" : "s"}
          </p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Turn on Show on homepage for reviews you want visitors to see.
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
                      {review.published ? " · On homepage" : " · Hidden"}
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={review.published ? "outline" : "primary"}
                    disabled={busyId === review.id}
                    onClick={() => void setPublished(review.id, !review.published)}
                  >
                    {review.published ? "Hide from homepage" : "Show on homepage"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-red-700 hover:bg-red-50"
                    disabled={busyId === review.id}
                    onClick={() => void remove(review.id, review.name)}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
