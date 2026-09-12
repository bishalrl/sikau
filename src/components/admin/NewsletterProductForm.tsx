"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type PlanRow = {
  id: string;
  code: string;
  label: string;
  priceNpr: number;
  listPriceNpr: number | null;
  discountPercent: number | null;
  perDayNpr: number | null;
  badge: string | null;
  sortOrder: number;
  isActive: boolean;
};

type Product = {
  id: string;
  title: string;
  description: string;
  priceNpr: number;
  coverImage: string | null;
  samplePdfPath: string | null;
  previewImagesJson: string;
  paymentQrPath: string | null;
  paymentInstructions: string | null;
  isActive: boolean;
  community: { id: string; slug: string; name: string };
  plans: PlanRow[];
};

function parsePreviews(raw: string) {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function NewsletterProductForm({ initial }: { initial: Product }) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [priceNpr, setPriceNpr] = useState(String(initial.priceNpr));
  const [paymentInstructions, setPaymentInstructions] = useState(initial.paymentInstructions ?? "");
  const [isActive, setIsActive] = useState(initial.isActive);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [samplePdf, setSamplePdf] = useState<File | null>(null);
  const previews = parsePreviews(initial.previewImagesJson);
  const [plans, setPlans] = useState(
    initial.plans.map((p) => ({
      id: p.id,
      code: p.code,
      label: p.label,
      priceNpr: String(p.priceNpr),
      listPriceNpr: p.listPriceNpr != null ? String(p.listPriceNpr) : "",
      discountPercent: p.discountPercent != null ? String(p.discountPercent) : "",
      perDayNpr: p.perDayNpr != null ? String(p.perDayNpr) : "",
      badge: p.badge ?? "",
    })),
  );
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  function updatePlan(id: string, field: string, value: string) {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("priceNpr", priceNpr);
    formData.append("paymentInstructions", paymentInstructions);
    formData.append("isActive", String(isActive));
    formData.append(
      "plans",
      JSON.stringify(
        plans.map((p) => ({
          id: p.id,
          priceNpr: Number(p.priceNpr) || 0,
          listPriceNpr: p.listPriceNpr === "" ? null : Number(p.listPriceNpr),
          discountPercent: p.discountPercent === "" ? null : Number(p.discountPercent),
          perDayNpr: p.perDayNpr === "" ? null : Number(p.perDayNpr),
          badge: p.badge || null,
        })),
      ),
    );
    if (qrFile) formData.append("paymentQr", qrFile);
    if (coverFile) formData.append("coverImage", coverFile);
    if (samplePdf) formData.append("samplePdf", samplePdf);
    for (const file of previewFiles) {
      formData.append("previewImages", file);
    }

    const response = await fetch("/api/admin/newsletter/product", {
      method: "PATCH",
      body: formData,
    });
    const data = await response.json();
    setSaving(false);

    if (!response.ok) {
      setMessage(data.error ?? "Unable to save.");
      return;
    }

    setMessage("Newsletter product saved.");
    setQrFile(null);
    setCoverFile(null);
    setPreviewFiles([]);
    setSamplePdf(null);
  }

  return (
    <form onSubmit={handleSave} className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-headline-md text-on-background">Product settings</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Group: /community/{initial.community.slug}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-on-background">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active for purchase
        </label>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Fallback price (NPR)</label>
        <input
          type="number"
          min={0}
          value={priceNpr}
          onChange={(e) => setPriceNpr(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          required
        />
        <p className="mt-1 text-xs text-on-surface-variant">Used only if a plan is missing.</p>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 p-4">
        <h3 className="font-headline-sm text-on-background">Subscription plans</h3>
        <p className="mt-1 text-xs text-on-surface-variant">
          Edit plan prices shown on the NEPSE Weekly landing page.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-on-surface-variant">
              <tr>
                <th className="pb-2 pr-3 font-semibold">Plan</th>
                <th className="pb-2 pr-3 font-semibold">Price</th>
                <th className="pb-2 pr-3 font-semibold">List</th>
                <th className="pb-2 pr-3 font-semibold">% off</th>
                <th className="pb-2 pr-3 font-semibold">/day</th>
                <th className="pb-2 font-semibold">Badge</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-t border-outline-variant/20">
                  <td className="py-2 pr-3 font-medium text-on-background">
                    {plan.label}
                    <span className="mt-0.5 block text-xs font-normal text-on-surface-variant">
                      {plan.code}
                    </span>
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      value={plan.priceNpr}
                      onChange={(e) => updatePlan(plan.id, "priceNpr", e.target.value)}
                      className="w-24 rounded-lg border border-outline-variant/50 bg-white px-2 py-1.5"
                      required
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      value={plan.listPriceNpr}
                      onChange={(e) => updatePlan(plan.id, "listPriceNpr", e.target.value)}
                      className="w-24 rounded-lg border border-outline-variant/50 bg-white px-2 py-1.5"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={plan.discountPercent}
                      onChange={(e) => updatePlan(plan.id, "discountPercent", e.target.value)}
                      className="w-16 rounded-lg border border-outline-variant/50 bg-white px-2 py-1.5"
                    />
                  </td>
                  <td className="py-2 pr-3">
                    <input
                      type="number"
                      min={0}
                      value={plan.perDayNpr}
                      onChange={(e) => updatePlan(plan.id, "perDayNpr", e.target.value)}
                      className="w-16 rounded-lg border border-outline-variant/50 bg-white px-2 py-1.5"
                    />
                  </td>
                  <td className="py-2">
                    <select
                      value={plan.badge}
                      onChange={(e) => updatePlan(plan.id, "badge", e.target.value)}
                      className="rounded-lg border border-outline-variant/50 bg-white px-2 py-1.5"
                    >
                      <option value="">None</option>
                      <option value="MOST_POPULAR">Most Popular</option>
                      <option value="BEST_VALUE">Best Value</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low/40 p-4 space-y-4">
        <div>
          <h3 className="font-headline-sm text-on-background">Landing images &amp; sample PDF</h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            These show on /newsletter. The cover is not the ebook image — upload the NEPSE Weekly report cover here.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Cover image</label>
          {(coverFile || initial.coverImage) && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverFile ? URL.createObjectURL(coverFile) : (initial.coverImage ?? "")}
              alt="Newsletter cover"
              className="mb-3 max-h-56 rounded-xl border border-outline-variant/30 bg-white object-contain"
            />
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Report preview images (up to 6)</label>
          {previews.length > 0 && previewFiles.length === 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {previews.map((src) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={src} src={src} alt="" className="h-20 w-16 rounded-lg object-cover" />
              ))}
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPreviewFiles(Array.from(e.target.files ?? []).slice(0, 6))}
            className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
          />
          {previewFiles.length > 0 && (
            <p className="mt-1 text-xs text-on-surface-variant">
              {previewFiles.length} new preview image{previewFiles.length === 1 ? "" : "s"} selected — saving replaces the old previews.
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Sample report PDF</label>
          {initial.samplePdfPath && !samplePdf && (
            <a
              href={initial.samplePdfPath}
              target="_blank"
              rel="noreferrer"
              className="mb-2 inline-block text-sm font-medium text-primary"
            >
              View current sample PDF
            </a>
          )}
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => setSamplePdf(e.target.files?.[0] ?? null)}
            className="w-full rounded-xl border border-outline-variant/50 bg-white px-4 py-3"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Payment instructions</label>
        <textarea
          value={paymentInstructions}
          onChange={(e) => setPaymentInstructions(e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Payment QR image</label>
        {initial.paymentQrPath && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={initial.paymentQrPath}
            alt="Current QR"
            className="mb-3 h-28 w-28 rounded-xl border border-outline-variant/30 bg-white object-contain p-2"
          />
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setQrFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save product"}
      </Button>
      {message && <p className="text-sm text-on-surface-variant">{message}</p>}
    </form>
  );
}
