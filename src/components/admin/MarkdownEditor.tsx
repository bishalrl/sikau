"use client";

import ReactMarkdown from "react-markdown";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function MarkdownEditor({ value, onChange }: Props) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={12}
        className="min-h-[320px] rounded-2xl border border-outline-variant/50 bg-surface-container-lowest p-4 font-mono text-sm"
      />
      <div className="rounded-2xl border border-outline-variant/40 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-on-surface-variant">Preview</p>
        <div className="prose prose-sm max-w-none text-on-background">
          <ReactMarkdown>{value}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
