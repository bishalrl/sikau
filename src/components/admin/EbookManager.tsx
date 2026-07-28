"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Button } from "@/components/ui/Button";
import { SITE_ASSET_FILES } from "@/lib/site-assets";

type EbookItem = {
  id: string;
  slug: string;
  title: string;
  titleNe: string | null;
  description: string;
  content: string;
  coverImage: string | null;
  filePath: string | null;
  priceNpr: number;
  listPriceNpr: number | null;
  promoEndsAt: string | Date | null;
  isFree: boolean;
  paymentQrPath: string | null;
  paymentInstructions: string | null;
  status: "DRAFT" | "PUBLISHED";
};

const emptyForm = {
  id: "" as string,
  slug: "",
  title: "",
  titleNe: "",
  description: "",
  content: "",
  coverImage: "",
  filePath: SITE_ASSET_FILES.pdf as string,
  priceNpr: "599",
  listPriceNpr: "",
  promoEndsAt: "",
  isFree: false,
  paymentQrPath: SITE_ASSET_FILES.qr as string,
  paymentInstructions: "Scan QR and upload your receipt for ebook access.",
  status: "DRAFT",
};

function toDatetimeLocal(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function EbookManager({
  ebooks,
  siteEbookSlugs,
  siteEbooksFound,
}: {
  ebooks: EbookItem[];
  siteEbookSlugs: string[];
  siteEbooksFound: number;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [replacingSitePdf, setReplacingSitePdf] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const sortedEbooks = [...ebooks].sort((a, b) => {
    const aSite = siteEbookSlugs.includes(a.slug) ? 1 : 0;
    const bSite = siteEbookSlugs.includes(b.slug) ? 1 : 0;
    if (aSite !== bSite) return bSite - aSite;
    return a.title.localeCompare(b.title);
  });

  function loadEbook(ebook: EbookItem) {
    setMessage("");
    setForm({
      id: ebook.id,
      slug: ebook.slug,
      title: ebook.title,
      titleNe: ebook.titleNe ?? "",
      description: ebook.description,
      content: ebook.content ?? "",
      coverImage: ebook.coverImage ?? "",
      filePath: ebook.filePath ?? SITE_ASSET_FILES.pdf,
      priceNpr: String(ebook.priceNpr),
      listPriceNpr: ebook.listPriceNpr != null ? String(ebook.listPriceNpr) : "",
      promoEndsAt: toDatetimeLocal(ebook.promoEndsAt),
      isFree: ebook.isFree,
      paymentQrPath: ebook.paymentQrPath ?? "",
      paymentInstructions: ebook.paymentInstructions ?? "",
      status: ebook.status,
    });
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
  }

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
    setMessage(folder === "ebooks" ? "PDF uploaded — save the ebook or replace the site PDF below." : "File uploaded.");
  }

  async function replaceSitePdf() {
    if (!form.filePath?.startsWith("/uploads/")) {
      setMessage("Upload a new PDF first (not the bundled e-book.pdf path).");
      return;
    }
    setReplacingSitePdf(true);
    setMessage("");
    const response = await fetch("/api/admin/ebooks/replace-site-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filePath: form.filePath, syncNepseEbooks: true }),
    });
    const data = await response.json();
    setReplacingSitePdf(false);
    if (!response.ok) {
      setMessage(data.error ?? "Unable to replace site PDF.");
      return;
    }
    setForm((current) => ({ ...current, filePath: SITE_ASSET_FILES.pdf }));
    setMessage("Site PDF updated (e-book.pdf). NEPSE packages now use the new file.");
    router.refresh();
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
        listPriceNpr: form.listPriceNpr.trim() ? Number(form.listPriceNpr) : null,
        promoEndsAt: form.promoEndsAt.trim() ? new Date(form.promoEndsAt).toISOString() : null,
      }),
    });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setMessage(data.error ?? "Unable to save.");
      return;
    }
    setMessage("Ebook saved.");
    if (data.ebook?.id) {
      setForm((current) => ({ ...current, id: data.ebook.id }));
    }
    router.refresh();
  }

  async function handleDelete(ebook: EbookItem) {
    const ok = window.confirm(
      `Delete "${ebook.title}"? Orders and community links for this ebook will be removed.`,
    );
    if (!ok) return;

    setDeletingId(ebook.id);
    setMessage("");
    const response = await fetch(`/api/admin/ebooks/${ebook.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Unable to delete.");
      return;
    }
    if (form.id === ebook.id) resetForm();
    setMessage("Ebook deleted.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-primary/20 bg-primary-container/5 p-5">
        <h2 className="font-headline-md text-on-background">Live site ebooks</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          These are the ebooks used on the public `/ebooks` page and payment flow.
        </p>
        <p className="mt-2 text-sm text-on-background">
          Found {siteEbooksFound} of {siteEbookSlugs.length}: {siteEbookSlugs.map((slug, index) => (
            <span key={slug}>
              {index > 0 ? ", " : ""}
              <code>{slug}</code>
            </span>
          ))}
        </p>
        {siteEbooksFound === 0 && (
          <p className="mt-2 text-sm text-red-600">
            No live site ebook records were loaded from the database. This is not dummy content now; it usually means the
            database is missing the seeded NEPSE ebooks or the latest schema changes.
          </p>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {sortedEbooks.map((ebook) => (
          <div
            key={ebook.id}
            className={`rounded-3xl border bg-white p-5 ${
              form.id === ebook.id ? "border-primary ring-2 ring-primary/20" : "border-outline-variant/30"
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">{ebook.status}</p>
              {siteEbookSlugs.includes(ebook.slug) && (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                  Live on /ebooks
                </span>
              )}
            </div>
            <h3 className="mt-2 font-headline-md text-on-background">{ebook.title}</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              <code>{ebook.slug}</code>
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              {ebook.isFree ? "Free" : `NPR ${ebook.priceNpr.toLocaleString()}`}
              {!ebook.isFree && ebook.listPriceNpr != null && ebook.listPriceNpr > ebook.priceNpr
                ? ` · was ${ebook.listPriceNpr.toLocaleString()}`
                : ""}
            </p>
            <p className="mt-1 truncate text-xs text-on-surface-variant">{ebook.filePath ?? "No PDF"}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => loadEbook(ebook)}>
                Edit
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={deletingId === ebook.id}
                onClick={() => handleDelete(ebook)}
              >
                {deletingId === ebook.id ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-headline-md text-on-background">{form.id ? "Edit ebook" : "New ebook"}</h2>
          {form.id && (
            <Button type="button" size="sm" variant="ghost" onClick={resetForm}>
              Clear form
            </Button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
          <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Field label="Title (Nepali)" value={form.titleNe} onChange={(value) => setForm({ ...form, titleNe: value })} />
          <Field label="Sale price (NPR)" value={form.priceNpr} onChange={(value) => setForm({ ...form, priceNpr: value })} />
          <Field
            label="List price (NPR, optional — shown struck through during promo)"
            value={form.listPriceNpr}
            onChange={(value) => setForm({ ...form, listPriceNpr: value })}
          />
          <label className="block text-sm font-medium text-on-background">
            Promo ends (limited-time discount)
            <input
              type="datetime-local"
              value={form.promoEndsAt}
              onChange={(e) => setForm({ ...form, promoEndsAt: e.target.value })}
              className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
            />
          </label>
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
            Upload a PDF for this ebook. Use &quot;Update site PDF&quot; to replace the main NEPSE file
            (<code>e-book.pdf</code>) that all bundled packages read.
          </p>
          <p className="mt-2 text-xs text-on-surface-variant">
            If you only want to update the real NEPSE book already on the site, click <strong>Edit</strong> on the card
            marked <strong>Live on /ebooks</strong>, upload the PDF, then click <strong>Update site PDF</strong>.
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
          <Button
            type="button"
            className="mt-3"
            size="sm"
            variant="outline"
            disabled={replacingSitePdf || uploadingPdf}
            onClick={replaceSitePdf}
          >
            {replacingSitePdf ? "Updating site PDF…" : "Update site PDF (e-book.pdf)"}
          </Button>
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
