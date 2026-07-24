"use client";

import { useState } from "react";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Button } from "@/components/ui/Button";

type EbookItem = {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
  priceNpr: number;
  isFree: boolean;
};

export function EbookManager({ ebooks }: { ebooks: EbookItem[] }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [form, setForm] = useState({
    slug: "",
    title: "",
    titleNe: "",
    description: "",
    content: "",
    coverImage: "",
    filePath: "",
    priceNpr: "0",
    isFree: true,
    paymentQrPath: "",
    paymentInstructions: "Scan QR and upload your receipt for ebook access.",
    status: "DRAFT",
  });

  async function upload(file: File | null, folder: "ebooks" | "payment-qr" | "blog-covers") {
    if (!file) return;
    if (folder === "ebooks") {
      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        setMessage("Please upload a PDF file for the ebook.");
        return;
      }
      setUploadingPdf(true);
    }
    const formData = new FormData();
    formData.append("folder", folder);
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (folder === "ebooks") setUploadingPdf(false);
    if (!response.ok) {
      setMessage(data.error ?? "Upload failed.");
      return;
    }
    if (folder === "ebooks") setForm((current) => ({ ...current, filePath: data.path }));
    if (folder === "payment-qr") setForm((current) => ({ ...current, paymentQrPath: data.path }));
    if (folder === "blog-covers") setForm((current) => ({ ...current, coverImage: data.path }));
    setMessage(folder === "ebooks" ? "PDF uploaded — readers will see it page by page." : "File uploaded.");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/admin/ebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        priceNpr: Number(form.priceNpr),
      }),
    });
    const data = await response.json();
    setSubmitting(false);
    setMessage(response.ok ? "Ebook saved. Refresh to see updates." : data.error ?? "Unable to save.");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {ebooks.map((ebook) => (
          <div key={ebook.id} className="rounded-3xl border border-outline-variant/30 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{ebook.status}</p>
            <h3 className="mt-2 font-headline-md text-on-background">{ebook.title}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">
              {ebook.isFree ? "Free" : `NPR ${ebook.priceNpr.toLocaleString()}`}
            </p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
          <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Field label="Title (Nepali)" value={form.titleNe} onChange={(value) => setForm({ ...form, titleNe: value })} />
          <Field label="Price (NPR)" value={form.priceNpr} onChange={(value) => setForm({ ...form, priceNpr: value })} />
          <Field
            label="Cover image path"
            value={form.coverImage}
            onChange={(value) => setForm({ ...form, coverImage: value })}
          />
          <Field
            label="Ebook PDF path (shown page by page)"
            value={form.filePath}
            onChange={(value) => setForm({ ...form, filePath: value })}
          />
          <Field
            label="Payment QR path"
            value={form.paymentQrPath}
            onChange={(value) => setForm({ ...form, paymentQrPath: value })}
          />
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary-container/5 p-4">
          <p className="text-sm font-semibold text-on-background">Ebook PDF</p>
          <p className="mt-1 text-sm text-on-surface-variant">
            Upload the ebook as a PDF. Readers open it in a page-by-page viewer (no full-file download).
            The Markdown field below is only an optional fallback if no PDF is provided.
          </p>
          <label className="mt-3 block text-sm font-medium text-on-background">
            Upload ebook PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => upload(e.target.files?.[0] ?? null, "ebooks")}
              className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
            />
          </label>
          {uploadingPdf && <p className="mt-2 text-xs text-on-surface-variant">Uploading PDF…</p>}
          {form.filePath && !uploadingPdf && (
            <p className="mt-2 text-xs font-medium text-primary">
              PDF attached: <code>{form.filePath}</code>
            </p>
          )}
        </div>

        <label className="block text-sm font-medium text-on-background">
          Description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          />
        </label>

        <div>
          <p className="mb-1 text-sm font-medium text-on-background">Readable content (Markdown — optional fallback)</p>
          <p className="mb-2 text-xs text-on-surface-variant">
            Used only when no PDF is attached. If a PDF is uploaded, readers see the PDF page by page.
          </p>
          <MarkdownEditor value={form.content} onChange={(value) => setForm({ ...form, content: value })} />
        </div>

        <label className="block text-sm font-medium text-on-background">
          Payment instructions
          <textarea
            value={form.paymentInstructions}
            onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-on-background">
            Upload cover
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload(e.target.files?.[0] ?? null, "blog-covers")}
              className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
            />
          </label>
          <label className="block text-sm font-medium text-on-background">
            Upload payment QR
            <input
              type="file"
              accept="image/*"
              onChange={(e) => upload(e.target.files?.[0] ?? null, "payment-qr")}
              className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-on-surface-variant">
            <input
              type="checkbox"
              checked={form.isFree}
              onChange={(e) => setForm({ ...form, isFree: e.target.checked })}
            />
            Free ebook
          </label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Ebook"}
          </Button>
          {message && <p className="text-sm text-on-surface-variant">{message}</p>}
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-sm font-medium text-on-background">
      {label}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
      />
    </label>
  );
}
