"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Button } from "@/components/ui/Button";
import { SITE_ASSET_FILES } from "@/lib/site-assets";

type CommunityOption = { id: string; slug: string; name: string };

type EbookItem = {
  id: string;
  slug: string;
  title: string;
  titleNe: string | null;
  headline?: string | null;
  description: string;
  content: string;
  curriculumJson?: string | null;
  audienceJson?: string | null;
  coverImage: string | null;
  filePath: string | null;
  priceNpr: number;
  listPriceNpr: number | null;
  promoEndsAt: string | Date | null;
  isFree: boolean;
  paymentQrPath: string | null;
  paymentInstructions: string | null;
  communityOfferEnabled?: boolean;
  communityOfferName?: string | null;
  communityOfferPriceNpr?: number | null;
  communityAccessType?: string | null;
  communityBenefitsJson?: string | null;
  communityId?: string | null;
  community?: CommunityOption | null;
  status: "DRAFT" | "PUBLISHED";
};

const emptyForm = {
  id: "" as string,
  slug: "",
  title: "",
  titleNe: "",
  headline: "",
  description: "",
  content: "",
  curriculumText: "",
  audienceText: "",
  coverImage: "",
  filePath: SITE_ASSET_FILES.pdf as string,
  priceNpr: "599",
  listPriceNpr: "",
  promoEndsAt: "",
  isFree: false,
  paymentQrPath: SITE_ASSET_FILES.qr as string,
  paymentInstructions: "Scan QR and upload your receipt for ebook access.",
  communityOfferEnabled: false,
  communityOfferName: "",
  communityOfferPriceNpr: "",
  communityAccessType: "LIFETIME",
  communityBenefitsText: "",
  communityId: "",
  status: "PUBLISHED" as "DRAFT" | "PUBLISHED",
};

function toDatetimeLocal(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function linesToJsonArray(text: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  return JSON.stringify(lines);
}

function jsonArrayToLines(raw?: string | null) {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return "";
    return parsed.map((item) => String(item)).join("\n");
  } catch {
    return "";
  }
}

function curriculumToText(raw?: string | null) {
  if (!raw) return "";
  try {
    const parsed = JSON.parse(raw) as Array<{ phase?: string; title?: string; detail?: string }>;
    if (!Array.isArray(parsed)) return "";
    return parsed
      .map((item) => {
        const title = item.title?.trim() || "";
        const detail = item.detail?.trim() || "";
        if (!title) return "";
        return detail ? `${title} | ${detail}` : title;
      })
      .filter(Boolean)
      .join("\n");
  } catch {
    return "";
  }
}

function textToCurriculumJson(text: string) {
  const items = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [titlePart, ...rest] = line.split("|");
      return {
        phase: `Phase ${index + 1}`,
        title: (titlePart ?? "").trim(),
        detail: rest.join("|").trim(),
      };
    });
  return JSON.stringify(items);
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function EbookManager({
  ebooks,
  communities,
  siteEbookSlugs,
  siteEbooksFound,
}: {
  ebooks: EbookItem[];
  communities: CommunityOption[];
  siteEbookSlugs: string[];
  siteEbooksFound: number;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
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
      headline: ebook.headline ?? "",
      description: ebook.description,
      content: ebook.content ?? "",
      curriculumText: curriculumToText(ebook.curriculumJson),
      audienceText: jsonArrayToLines(ebook.audienceJson),
      coverImage: ebook.coverImage ?? "",
      filePath: ebook.filePath ?? SITE_ASSET_FILES.pdf,
      priceNpr: String(ebook.priceNpr),
      listPriceNpr: ebook.listPriceNpr != null ? String(ebook.listPriceNpr) : "",
      promoEndsAt: toDatetimeLocal(ebook.promoEndsAt),
      isFree: ebook.isFree,
      paymentQrPath: ebook.paymentQrPath ?? "",
      paymentInstructions: ebook.paymentInstructions ?? "",
      communityOfferEnabled: Boolean(ebook.communityOfferEnabled),
      communityOfferName: ebook.communityOfferName ?? "",
      communityOfferPriceNpr:
        ebook.communityOfferPriceNpr != null ? String(ebook.communityOfferPriceNpr) : "",
      communityAccessType: ebook.communityAccessType ?? "LIFETIME",
      communityBenefitsText: jsonArrayToLines(ebook.communityBenefitsJson),
      communityId: ebook.communityId ?? ebook.community?.id ?? "",
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
    setMessage(folder === "ebooks" ? "PDF uploaded." : "File uploaded.");
  }

  async function saveEbook(nextStatus?: "DRAFT" | "PUBLISHED") {
    setSubmitting(true);
    setMessage("");
    const status = nextStatus ?? form.status;
    const response = await fetch("/api/admin/ebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: form.slug.trim(),
        title: form.title,
        titleNe: form.titleNe,
        headline: form.headline,
        description: form.description,
        content: form.content,
        curriculumJson: textToCurriculumJson(form.curriculumText),
        audienceJson: linesToJsonArray(form.audienceText),
        coverImage: form.coverImage,
        filePath: form.filePath,
        priceNpr: Number(form.priceNpr),
        listPriceNpr: form.listPriceNpr.trim() ? Number(form.listPriceNpr) : null,
        promoEndsAt: form.promoEndsAt.trim() ? new Date(form.promoEndsAt).toISOString() : null,
        isFree: form.isFree,
        paymentQrPath: form.paymentQrPath,
        paymentInstructions: form.paymentInstructions,
        communityOfferEnabled: form.communityOfferEnabled,
        communityOfferName: form.communityOfferName,
        communityOfferPriceNpr: form.communityOfferPriceNpr.trim()
          ? Number(form.communityOfferPriceNpr)
          : null,
        communityAccessType: form.communityAccessType,
        communityBenefitsJson: linesToJsonArray(form.communityBenefitsText),
        communityId: form.communityId || null,
        status,
      }),
    });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setMessage(data.error ?? "Unable to save.");
      return;
    }
    const savedStatus = (data.ebook?.status as "DRAFT" | "PUBLISHED" | undefined) ?? status;
    setForm((current) => ({
      ...current,
      id: data.ebook?.id ?? current.id,
      status: savedStatus,
    }));
    setMessage(
      savedStatus === "PUBLISHED"
        ? `Published — live at /ebooks/${form.slug}`
        : "Saved as draft (hidden from library).",
    );
    router.refresh();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await saveEbook();
  }

  async function publishEbook(ebook: EbookItem) {
    setSubmitting(true);
    setMessage("");
    loadEbook(ebook);
    // ensure form state used — call API directly from ebook data
    const response = await fetch("/api/admin/ebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: ebook.slug,
        title: ebook.title,
        titleNe: ebook.titleNe ?? "",
        headline: ebook.headline ?? "",
        description: ebook.description,
        content: ebook.content ?? "",
        curriculumJson: ebook.curriculumJson ?? "[]",
        audienceJson: ebook.audienceJson ?? "[]",
        coverImage: ebook.coverImage ?? "",
        filePath: ebook.filePath ?? "",
        priceNpr: ebook.priceNpr,
        listPriceNpr: ebook.listPriceNpr,
        promoEndsAt: ebook.promoEndsAt ? new Date(ebook.promoEndsAt).toISOString() : null,
        isFree: ebook.isFree,
        paymentQrPath: ebook.paymentQrPath ?? "",
        paymentInstructions: ebook.paymentInstructions ?? "",
        communityOfferEnabled: Boolean(ebook.communityOfferEnabled),
        communityOfferName: ebook.communityOfferName ?? "",
        communityOfferPriceNpr: ebook.communityOfferPriceNpr,
        communityAccessType: ebook.communityAccessType ?? "LIFETIME",
        communityBenefitsJson: ebook.communityBenefitsJson ?? "[]",
        communityId: ebook.communityId ?? ebook.community?.id ?? null,
        status: "PUBLISHED",
      }),
    });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setMessage(data.error ?? "Unable to publish.");
      return;
    }
    setMessage(`Published — /ebooks/${ebook.slug}`);
    router.refresh();
  }

  async function handleDelete(ebook: EbookItem) {
    const ok = window.confirm(
      `Delete "${ebook.title}" permanently?\n\nOrders and community links for this ebook will be removed. This cannot be undone.`,
    );
    if (!ok) return;

    setDeletingId(ebook.id);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/ebooks/${ebook.id}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(data.error ?? "Unable to delete.");
        return;
      }
      if (form.id === ebook.id) resetForm();
      setMessage(`Deleted “${ebook.title}”.`);
      router.refresh();
    } catch {
      setMessage("Unable to delete ebook. Check your connection and try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-primary/20 bg-primary-container/5 p-5">
        <h2 className="font-headline-md text-on-background">Ebook products</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Each card is an independent ebook. Community offers are configured per ebook.
        </p>
        <p className="mt-2 text-sm text-on-background">
          Canonical NEPSE guide found: {siteEbooksFound > 0 ? "yes" : "no"} (
          <code>{siteEbookSlugs[0]}</code>)
        </p>
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
              {ebook.isFree || ebook.priceNpr <= 0 ? (
                <span className="rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-900">
                  Free · no payment
                </span>
              ) : (
                <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                  Paid · payment page
                </span>
              )}
              {ebook.communityOfferEnabled && (
                <span className="rounded-full bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary">
                  Community offer
                </span>
              )}
            </div>
            <h3 className="mt-2 font-headline-md text-on-background">{ebook.title}</h3>
            <p className="mt-1 text-xs text-on-surface-variant">
              <code>/ebooks/{ebook.slug}</code>
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Solo: {ebook.isFree ? "Free" : `NPR ${ebook.priceNpr.toLocaleString()}`}
              {ebook.communityOfferEnabled && ebook.communityOfferPriceNpr != null
                ? ` · Bundle: NPR ${ebook.communityOfferPriceNpr.toLocaleString()}`
                : ""}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => loadEbook(ebook)}>
                Edit
              </Button>
              {ebook.status !== "PUBLISHED" && (
                <Button type="button" size="sm" onClick={() => publishEbook(ebook)} disabled={submitting}>
                  Publish
                </Button>
              )}
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
          <Field
            label="Title"
            value={form.title}
            onChange={(value) =>
              setForm((prev) => ({
                ...prev,
                title: value,
                // Auto-fill slug only while creating a new ebook.
                slug: prev.id ? prev.slug : slugify(value),
              }))
            }
          />
          <label className="block text-sm font-medium text-on-background">
            Slug (public URL)
            <input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) || e.target.value })}
              onBlur={() => setForm((prev) => ({ ...prev, slug: slugify(prev.slug) }))}
              className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
              required
            />
            {form.slug ? (
              <p className="mt-1 text-xs text-on-surface-variant">
                Public page: <code>/ebooks/{form.slug}</code>
                {form.status !== "PUBLISHED" ? " (draft — not live until Published)" : ""}
              </p>
            ) : null}
          </label>
          <Field
            label="Nepali title"
            value={form.titleNe}
            onChange={(value) => setForm({ ...form, titleNe: value })}
          />
          <Field
            label="Hero headline (optional)"
            value={form.headline}
            onChange={(value) => setForm({ ...form, headline: value })}
          />
        </div>

        <label className="block text-sm font-medium text-on-background">
          Short description
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
            required
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-on-background">Long content / details</p>
          <MarkdownEditor
            value={form.content}
            onChange={(value) => setForm({ ...form, content: value })}
          />
        </div>

        <label className="block text-sm font-medium text-on-background">
          What you&apos;ll learn (one phase per line: Title | Detail)
          <textarea
            value={form.curriculumText}
            onChange={(e) => setForm({ ...form, curriculumText: e.target.value })}
            rows={5}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
            placeholder={"Mindset & Introduction | Build the right foundation\nStock Market Basics | How NEPSE works"}
          />
        </label>

        <label className="block text-sm font-medium text-on-background">
          Who this is for (one bullet per line)
          <textarea
            value={form.audienceText}
            onChange={(e) => setForm({ ...form, audienceText: e.target.value })}
            rows={4}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          />
        </label>

        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 p-4 space-y-4">
          <h3 className="font-headline-sm text-on-background">Ebook pricing</h3>
          <p className="text-sm text-on-surface-variant">
            <strong>Free</strong> = buyers skip payment and open the reader.
            <br />
            <strong>Paid</strong> = uncheck Free, set price &gt; 0 → buyers go to the payment / receipt page.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="block text-sm font-medium">
              Solo ebook price (NPR)
              <input
                type="number"
                min={0}
                value={form.priceNpr}
                onChange={(e) => {
                  const priceNpr = e.target.value;
                  const numeric = Number(priceNpr);
                  setForm({
                    ...form,
                    priceNpr,
                    isFree: !Number.isFinite(numeric) || numeric <= 0 ? form.isFree : false,
                  });
                }}
                className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
                required
                disabled={form.isFree}
              />
            </label>
            <label className="block text-sm font-medium">
              List price (optional)
              <input
                type="number"
                min={0}
                value={form.listPriceNpr}
                onChange={(e) => setForm({ ...form, listPriceNpr: e.target.value })}
                className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
                disabled={form.isFree}
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm font-medium pt-8">
              <input
                type="checkbox"
                checked={form.isFree}
                onChange={(e) =>
                  setForm({
                    ...form,
                    isFree: e.target.checked,
                    priceNpr: e.target.checked ? "0" : form.priceNpr === "0" ? "599" : form.priceNpr,
                  })
                }
              />
              Free ebook (no payment)
            </label>
          </div>
          {form.isFree || Number(form.priceNpr) <= 0 ? (
            <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
              This ebook is Free — the buy button will open the reader, not the payment page.
            </p>
          ) : (
            <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
              Paid ebook — buyers are sent to <code>/ebooks/{form.slug || "…"}/pay</code> to pay and upload a
              receipt.
            </p>
          )}

          <label className="inline-flex items-center gap-2 text-sm font-medium text-on-background">
            <input
              type="checkbox"
              checked={form.communityOfferEnabled}
              onChange={(e) => setForm({ ...form, communityOfferEnabled: e.target.checked })}
            />
            Enable community offer for this ebook
          </label>

          {form.communityOfferEnabled && (
            <div className="grid gap-4 md:grid-cols-2">
              <Field
                label="Community name"
                value={form.communityOfferName}
                onChange={(value) => setForm({ ...form, communityOfferName: value })}
              />
              <label className="block text-sm font-medium">
                Community price (NPR)
                <input
                  type="number"
                  min={0}
                  value={form.communityOfferPriceNpr}
                  onChange={(e) => setForm({ ...form, communityOfferPriceNpr: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
                  required={form.communityOfferEnabled}
                />
              </label>
              <label className="block text-sm font-medium">
                Community access type
                <select
                  value={form.communityAccessType}
                  onChange={(e) => setForm({ ...form, communityAccessType: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
                >
                  <option value="LIFETIME">Lifetime</option>
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">3 Months</option>
                  <option value="SEMIANNUAL">6 Months</option>
                  <option value="YEARLY">1 Year</option>
                </select>
              </label>
              <label className="block text-sm font-medium">
                Linked community
                <select
                  value={form.communityId}
                  onChange={(e) => setForm({ ...form, communityId: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
                  required={form.communityOfferEnabled}
                >
                  <option value="">Select community…</option>
                  {communities.map((community) => (
                    <option key={community.id} value={community.id}>
                      {community.name} ({community.slug})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium md:col-span-2">
                Community benefits (one per line)
                <textarea
                  value={form.communityBenefitsText}
                  onChange={(e) => setForm({ ...form, communityBenefitsText: e.target.value })}
                  rows={4}
                  className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
                  placeholder={"Monthly live sessions\nQ&A\nCommunity discussion\nAccountability"}
                />
              </label>
            </div>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm font-medium text-on-background">
            Upload PDF
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={(e) => upload(e.target.files?.[0] ?? null, "ebooks")}
              className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
            />
            {uploadingPdf && <span className="mt-1 block text-xs">Uploading…</span>}
            <span className="mt-1 block truncate text-xs text-on-surface-variant">{form.filePath}</span>
          </label>
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
          <label className="block text-sm font-medium text-on-background">
            Payment instructions
            <textarea
              value={form.paymentInstructions}
              onChange={(e) => setForm({ ...form, paymentInstructions: e.target.value })}
              rows={3}
              className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={form.status}
            onChange={(e) =>
              setForm({
                ...form,
                status: e.target.value === "DRAFT" ? "DRAFT" : "PUBLISHED",
              })
            }
            className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm"
          >
            <option value="PUBLISHED">Published (live for buyers)</option>
            <option value="DRAFT">Draft (hidden)</option>
          </select>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Ebook"}
          </Button>
          {form.status !== "PUBLISHED" && (
            <Button
              type="button"
              disabled={submitting || !form.slug || !form.title}
              onClick={() => saveEbook("PUBLISHED")}
            >
              Save & Publish
            </Button>
          )}
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
