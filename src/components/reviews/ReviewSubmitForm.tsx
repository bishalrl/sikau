"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const REVIEW_TYPES = [
  { value: "COURSE", label: "Course" },
  { value: "NEWSLETTER", label: "Newsletter" },
  { value: "EBOOK", label: "E-book" },
] as const;

export function ReviewSubmitForm() {
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState<(typeof REVIEW_TYPES)[number]["value"]>("COURSE");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  function onImageChange(file: File | null) {
    setImage(file);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("body", body);
    formData.append("type", type);
    if (image) formData.append("image", image);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to submit review.");
        setSubmitting(false);
        return;
      }
      setDone(true);
      setName("");
      setBody("");
      setType("COURSE");
      onImageChange(null);
    } catch {
      setError("Unable to submit review right now.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Submitted</p>
        <h2 className="mt-2 font-headline-lg text-on-background">Thank you for your review</h2>
        <p className="mt-2 text-on-surface-variant">We saved your feedback successfully.</p>
        <Button type="button" className="mt-6" onClick={() => setDone(false)}>
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5 rounded-3xl border border-outline-variant/30 bg-white p-6 sm:p-8">
      <div>
        <label htmlFor="review-type" className="mb-1 block text-sm font-medium text-on-background">
          Review type
        </label>
        <select
          id="review-type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          required
        >
          {REVIEW_TYPES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="review-name" className="mb-1 block text-sm font-medium text-on-background">
          Your name
        </label>
        <input
          id="review-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Sita Sharma"
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          required
          minLength={2}
          maxLength={80}
        />
      </div>

      <div>
        <label htmlFor="review-body" className="mb-1 block text-sm font-medium text-on-background">
          Your review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={6}
          placeholder="Share your experience with the course / newsletter / e-book…"
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          required
          minLength={10}
          maxLength={4000}
        />
      </div>

      <div>
        <label htmlFor="review-image" className="mb-1 block text-sm font-medium text-on-background">
          Photo <span className="font-normal text-on-surface-variant">(optional)</span>
        </label>
        <input
          id="review-image"
          type="file"
          accept="image/*"
          onChange={(e) => onImageChange(e.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm"
        />
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="Preview" className="mt-3 max-h-48 rounded-xl object-contain" />
        )}
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
      {error && <p className="text-sm text-error">{error}</p>}
    </form>
  );
}
