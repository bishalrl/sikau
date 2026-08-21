"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Product = {
  id: string;
  title: string;
  description: string;
  priceNpr: number;
  paymentQrPath: string | null;
  paymentInstructions: string | null;
  isActive: boolean;
  community: { id: string; slug: string; name: string };
};

export function NewsletterProductForm({ initial }: { initial: Product }) {
  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [priceNpr, setPriceNpr] = useState(String(initial.priceNpr));
  const [paymentInstructions, setPaymentInstructions] = useState(initial.paymentInstructions ?? "");
  const [isActive, setIsActive] = useState(initial.isActive);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

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
    if (qrFile) formData.append("paymentQr", qrFile);

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
        <label className="mb-1 block text-sm font-medium">Price (NPR)</label>
        <input
          type="number"
          min={0}
          value={priceNpr}
          onChange={(e) => setPriceNpr(e.target.value)}
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          required
        />
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
