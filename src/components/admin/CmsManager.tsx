"use client";

import { useMemo, useState } from "react";
import { CMS_GROUPS } from "@/lib/cms/catalog";
import type { CmsRecord } from "@/lib/cms/store";
import { Button } from "@/components/ui/Button";

type Props = {
  records: CmsRecord[];
  courseOptions?: Array<{ value: string; label: string }>;
  ebookOptions?: Array<{ value: string; label: string }>;
};

export function CmsManager({ records, courseOptions = [], ebookOptions = [] }: Props) {
  const [entries, setEntries] = useState(records);
  const [group, setGroup] = useState<(typeof CMS_GROUPS)[number]>("Homepage");
  const [openKey, setOpenKey] = useState("home.hero");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState("");

  const visible = useMemo(
    () => entries.filter((entry) => entry.groupName === group && entry.kind !== "item"),
    [entries, group],
  );

  function itemsFor(parentKey: string) {
    return entries
      .filter((entry) => entry.parentKey === parentKey)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  function patch(key: string, update: Partial<CmsRecord> | ((entry: CmsRecord) => CmsRecord)) {
    setEntries((current) =>
      current.map((entry) => {
        if (entry.key !== key) return entry;
        return typeof update === "function" ? update(entry) : { ...entry, ...update };
      }),
    );
  }

  function setField(key: string, field: string, value: string) {
    patch(key, (entry) => ({ ...entry, data: { ...entry.data, [field]: value } }));
  }

  async function upload(key: string, field: string, file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    setUploading(`${key}:${field}`);
    setError("");
    const formData = new FormData();
    formData.append("folder", "blog-covers");
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json();
    setUploading("");
    if (!response.ok) {
      setError(data.error ?? "Unable to upload image.");
      return;
    }
    setField(key, field, data.path);
    setMessage("Image uploaded. Save this section to publish it.");
  }

  async function save(keys: string[]) {
    setSaving(true);
    setMessage("");
    setError("");
    const payload = entries.filter((entry) => keys.includes(entry.key));
    const response = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        entries: payload.map((entry) => ({
          key: entry.key,
          enabled: entry.enabled,
          sortOrder: entry.sortOrder,
          label: entry.label,
          data: entry.data,
        })),
      }),
    });
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setError(data.error ?? "Unable to save.");
      return;
    }
    setMessage("Saved. The website will show this content.");
  }

  async function addItem(parentKey: string) {
    setError("");
    const response = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-item", parentKey }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to add item.");
      return;
    }
    const parent = entries.find((entry) => entry.key === parentKey);
    setEntries((current) => [
      ...current,
      {
        key: data.item.key,
        kind: "item",
        parentKey,
        label: data.item.label,
        placement: parent?.placement ?? "",
        groupName: parent?.groupName ?? group,
        sortOrder: data.item.sortOrder,
        enabled: true,
        data: data.item.data ?? {},
        fields: parent?.itemFields ?? [],
        itemFields: undefined,
      },
    ]);
    setMessage("Item added. Fill it in and save.");
  }

  async function removeItem(key: string) {
    if (!window.confirm("Remove this item from the website?")) return;
    const response = await fetch("/api/admin/cms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete-item", key }),
    });
    const data = await response.json();
    if (!response.ok) {
      setError(data.error ?? "Unable to delete item.");
      return;
    }
    setEntries((current) => current.filter((entry) => entry.key !== key));
  }

  function moveItem(parentKey: string, key: string, direction: -1 | 1) {
    const items = itemsFor(parentKey);
    const index = items.findIndex((item) => item.key === key);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(target, 0, moved);
    setEntries((current) =>
      current.map((entry) => {
        const position = next.findIndex((item) => item.key === entry.key);
        return position >= 0 ? { ...entry, sortOrder: position + 1 } : entry;
      }),
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {CMS_GROUPS.map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setGroup(name);
              const first = entries.find((entry) => entry.groupName === name && entry.kind !== "item");
              if (first) setOpenKey(first.key);
            }}
            className={`rounded-full px-3 py-1.5 text-sm ${group === name ? "bg-primary text-white" : "bg-white text-on-surface-variant"}`}
          >
            {name}
          </button>
        ))}
      </div>

      {message && <p className="rounded-2xl bg-primary-container/15 px-4 py-3 text-sm">{message}</p>}
      {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="space-y-3">
        {visible.map((entry) => {
          const open = openKey === entry.key;
          const children = itemsFor(entry.key);
          const saveKeys = [entry.key, ...children.map((child) => child.key)];
          return (
            <article key={entry.key} className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-white">
              <button
                type="button"
                onClick={() => setOpenKey(open ? "" : entry.key)}
                className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left"
              >
                <span>
                  <span className="block font-semibold text-on-background">{entry.label}</span>
                  <span className="mt-1 block text-sm text-on-surface-variant">Shows on: {entry.placement}</span>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${entry.enabled ? "bg-primary/10 text-primary" : "bg-surface-container text-on-surface-variant"}`}>
                  {entry.enabled ? "Visible" : "Hidden"}
                </span>
              </button>

              {open && (
                <div className="space-y-4 border-t border-outline-variant/20 px-5 py-4">
                  {entry.kind === "section" && (
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={entry.enabled}
                        onChange={(event) => patch(entry.key, { enabled: event.target.checked })}
                      />
                      Show this section on the website
                    </label>
                  )}

                  {entry.fields.map((field) => (
                    <Field
                      key={field.key}
                      label={field.label}
                      hint={field.hint}
                      type={field.type}
                      value={entry.data[field.key] ?? ""}
                      options={
                        field.optionsSource === "courses"
                          ? courseOptions
                          : field.optionsSource === "ebooks"
                            ? ebookOptions
                            : undefined
                      }
                      uploading={uploading === `${entry.key}:${field.key}`}
                      onChange={(value) => setField(entry.key, field.key, value)}
                      onFile={(file) => void upload(entry.key, field.key, file)}
                    />
                  ))}

                  {children.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold">Items in this section</p>
                      {children.map((child, index) => (
                        <div key={child.key} className="space-y-3 rounded-2xl bg-surface-container-low/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <label className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                checked={child.enabled}
                                onChange={(event) => patch(child.key, { enabled: event.target.checked })}
                              />
                              Visible
                            </label>
                            <div className="flex gap-2 text-sm">
                              <button type="button" onClick={() => moveItem(entry.key, child.key, -1)} disabled={index === 0}>
                                Up
                              </button>
                              <button type="button" onClick={() => moveItem(entry.key, child.key, 1)} disabled={index === children.length - 1}>
                                Down
                              </button>
                              {child.key.includes(".custom.") && (
                                <button type="button" className="text-red-700" onClick={() => void removeItem(child.key)}>
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                          {child.fields.map((field) => (
                            <Field
                              key={field.key}
                              label={field.label}
                              hint={field.hint}
                              type={field.type}
                              value={child.data[field.key] ?? ""}
                              options={
                                field.optionsSource === "courses"
                                  ? courseOptions
                                  : field.optionsSource === "ebooks"
                                    ? ebookOptions
                                    : undefined
                              }
                              uploading={uploading === `${child.key}:${field.key}`}
                              onChange={(value) => setField(child.key, field.key, value)}
                              onFile={(file) => void upload(child.key, field.key, file)}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" disabled={saving} onClick={() => void save(saveKeys)}>
                      {saving ? "Saving…" : "Save this section"}
                    </Button>
                    {entry.itemFields && entry.itemFields.length > 0 && (
                      <Button type="button" variant="outline" onClick={() => void addItem(entry.key)}>
                        Add item
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  type,
  value,
  options,
  uploading,
  onChange,
  onFile,
}: {
  label: string;
  hint?: string;
  type: "text" | "textarea" | "image" | "url" | "select";
  value: string;
  options?: Array<{ value: string; label: string }>;
  uploading: boolean;
  onChange: (value: string) => void;
  onFile: (file: File | null) => void;
}) {
  if (type === "select") {
    return (
      <label className="block text-sm font-medium">
        {label}
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-white px-3 py-2"
        >
          <option value="">None — hide this promo</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {hint && <span className="mt-1 block text-xs font-normal text-on-surface-variant">{hint}</span>}
        {options && options.length === 0 && (
          <span className="mt-1 block text-xs font-normal text-red-700">
            No published items yet. Publish a course or ebook first.
          </span>
        )}
      </label>
    );
  }

  if (type === "image") {
    return (
      <label className="block text-sm font-medium">
        {label}
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="mt-2 h-28 w-full rounded-xl bg-surface-container object-contain" />
        ) : (
          <span className="mt-2 block text-xs font-normal text-on-surface-variant">No image yet.</span>
        )}
        <input type="file" accept="image/*" className="mt-2 block w-full text-sm" onChange={(event) => onFile(event.target.files?.[0] ?? null)} />
        {uploading && <span className="mt-1 block text-xs text-primary">Uploading…</span>}
        {hint && <span className="mt-1 block text-xs font-normal text-on-surface-variant">{hint}</span>}
      </label>
    );
  }

  if (type === "textarea") {
    return (
      <label className="block text-sm font-medium">
        {label}
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={3}
          className="mt-1 w-full rounded-xl border border-outline-variant/50 px-3 py-2"
        />
        {hint && <span className="mt-1 block text-xs font-normal text-on-surface-variant">{hint}</span>}
      </label>
    );
  }

  return (
    <label className="block text-sm font-medium">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-xl border border-outline-variant/50 px-3 py-2"
      />
      {hint && <span className="mt-1 block text-xs font-normal text-on-surface-variant">{hint}</span>}
    </label>
  );
}
