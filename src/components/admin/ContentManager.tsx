"use client";

import { useMemo, useState } from "react";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Button } from "@/components/ui/Button";
import type { WebsiteContentRecord } from "@/lib/repositories";

type Props = {
  records: WebsiteContentRecord[];
};

export function ContentManager({ records }: Props) {
  const [allRecords, setAllRecords] = useState(records);
  const [activeKey, setActiveKey] = useState(records[0]?.key ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const activeRecord = useMemo(
    () => allRecords.find((record) => record.key === activeKey) ?? allRecords[0],
    [activeKey, allRecords],
  );

  async function save(status: "DRAFT" | "PUBLISHED") {
    if (!activeRecord) return;
    setSaving(true);
    setMessage("");

    const response = await fetch("/api/admin/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...activeRecord, status }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error ?? "Unable to save content.");
      setSaving(false);
      return;
    }

    setAllRecords((current) =>
      current.map((record) =>
        record.key === activeRecord.key
          ? { ...record, markdown: activeRecord.markdown, title: activeRecord.title, status }
          : record,
      ),
    );
    setMessage(status === "PUBLISHED" ? "Published successfully." : "Draft saved.");
    setSaving(false);
  }

  if (!activeRecord) {
    return <p className="text-sm text-on-surface-variant">No content keys found.</p>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-3xl border border-outline-variant/30 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-on-surface-variant">Content Keys</p>
        <div className="space-y-2">
          {allRecords.map((record) => (
            <button
              key={record.key}
              type="button"
              onClick={() => setActiveKey(record.key)}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                record.key === activeRecord.key
                  ? "bg-primary text-white"
                  : "bg-surface-container-low text-on-surface-variant hover:bg-primary-container/10"
              }`}
            >
              <div className="font-medium">{record.title}</div>
              <div className="mt-1 text-xs opacity-80">{record.key}</div>
            </button>
          ))}
        </div>
      </aside>

      <section className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-on-background">Title</label>
            <input
              value={activeRecord.title}
              onChange={(e) =>
                setAllRecords((current) =>
                  current.map((record) =>
                    record.key === activeRecord.key ? { ...record, title: e.target.value } : record,
                  ),
                )
              }
              className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-on-background">Locale</label>
            <input
              value={activeRecord.locale}
              readOnly
              className="w-full rounded-xl border border-outline-variant/30 bg-surface-container-low px-4 py-3 text-on-surface-variant"
            />
          </div>
        </div>

        <MarkdownEditor
          value={activeRecord.markdown}
          onChange={(value) =>
            setAllRecords((current) =>
              current.map((record) => (record.key === activeRecord.key ? { ...record, markdown: value } : record)),
            )
          }
        />

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => save("DRAFT")} disabled={saving}>
            Save Draft
          </Button>
          <Button type="button" onClick={() => save("PUBLISHED")} disabled={saving}>
            Publish
          </Button>
          {message && <p className="self-center text-sm text-on-surface-variant">{message}</p>}
        </div>
      </section>
    </div>
  );
}
