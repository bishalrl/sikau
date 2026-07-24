"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function ReceiptUploadForm({ courseSlug }: { courseSlug: string }) {
  const router = useRouter();
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
    formData.append("courseSlug", courseSlug);
    formData.append("notes", notes);
    formData.append("receipt", file);

    const response = await fetch("/api/payments", {
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
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6">
      <h2 className="font-headline-md text-on-background">Upload payment receipt</h2>
      <p className="text-sm text-on-surface-variant">
        After scanning the QR and paying, upload a clear image or PDF of your receipt.
      </p>
      <div>
        <label className="mb-1 block text-sm font-medium text-on-background">Receipt file</label>
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-on-background">Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Transaction ID, mobile wallet used, etc."
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Uploading..." : "Submit Receipt for Approval"}
      </Button>
      {message && <p className="text-sm text-on-surface-variant">{message}</p>}
    </form>
  );
}
