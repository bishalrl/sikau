import type { Metadata } from "next";
import { ReviewSubmitForm } from "@/components/reviews/ReviewSubmitForm";

export const metadata: Metadata = {
  title: "Share your review | Sikau Paisa",
  description: "Tell us about your experience with our course, newsletter, or e-book.",
};

export default function ReviewPage() {
  return (
    <div className="site-container py-xl">
      <div className="mx-auto max-w-xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Feedback</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Share your review</h1>
        <p className="mt-3 text-on-surface-variant">
          Pick what you took (course, newsletter, or e-book), write your feedback, and optionally add a
          photo. No login required.
        </p>
        <div className="mt-8">
          <ReviewSubmitForm />
        </div>
      </div>
    </div>
  );
}
