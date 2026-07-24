"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function EbookReceiptForm({ ebookSlug }: { ebookSlug: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage("Choose a receipt before uploading.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    const formData = new FormData();
    formData.append("ebookSlug", ebookSlug);
    formData.append("notes", notes);
    formData.append("receipt", file);

    const response = await fetch("/api/ebooks/payments", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    setSubmitting(false);

    if (!response.ok) {
      setMessage(data.error ?? "Unable to upload receipt.");
      return;
    }

    setMessage("Receipt uploaded. Admin review is pending.");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6">
      <div>
        <label className="mb-1 block text-sm font-medium text-on-background">Upload Receipt</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-on-background">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
      </div>
      <Button type="submit" disabled={submitting}>
        {submitting ? "Uploading..." : "Upload Receipt"}
      </Button>
      {message && <p className="text-sm text-on-surface-variant">{message}</p>}
    </form>
  );
}
