"use client";

import { useState } from "react";
import { MarkdownEditor } from "@/components/admin/MarkdownEditor";
import { Button } from "@/components/ui/Button";

type BlogItem = {
  id: string;
  slug: string;
  title: string;
  status: "DRAFT" | "PUBLISHED";
};

export function BlogManager({ posts }: { posts: BlogItem[] }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [coverPath, setCoverPath] = useState("");
  const [form, setForm] = useState({
    slug: "",
    title: "",
    titleNe: "",
    excerpt: "",
    content: "## New blog post\n\nWrite your article here.",
    coverImage: "",
    status: "DRAFT",
  });

  async function handleCoverUpload(file: File | null) {
    if (!file) return;
    const formData = new FormData();
    formData.append("folder", "blog-covers");
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (response.ok) {
      setCoverPath(data.path);
      setForm((current) => ({ ...current, coverImage: data.path }));
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/admin/blogs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    setSubmitting(false);
    setMessage(response.ok ? "Blog post saved. Refresh to see updates." : data.error ?? "Unable to save.");
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {posts.map((post) => (
          <div key={post.id} className="rounded-3xl border border-outline-variant/30 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{post.status}</p>
            <h3 className="mt-2 font-headline-md text-on-background">{post.title}</h3>
            <p className="mt-1 text-sm text-on-surface-variant">/{post.slug}</p>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Slug" value={form.slug} onChange={(value) => setForm({ ...form, slug: value })} />
          <Field label="Title" value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
          <Field label="Title (Nepali)" value={form.titleNe} onChange={(value) => setForm({ ...form, titleNe: value })} />
          <Field
            label="Cover image URL / path"
            value={form.coverImage}
            onChange={(value) => setForm({ ...form, coverImage: value })}
          />
        </div>

        <label className="block text-sm font-medium text-on-background">
          Upload cover
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleCoverUpload(e.target.files?.[0] ?? null)}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          />
          {coverPath && <span className="mt-1 block text-xs text-on-surface-variant">Uploaded: {coverPath}</span>}
        </label>

        <label className="block text-sm font-medium text-on-background">
          Excerpt
          <textarea
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-medium text-on-background">Content (Markdown)</p>
          <MarkdownEditor value={form.content} onChange={(value) => setForm({ ...form, content: value })} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3 text-sm"
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : "Save Blog Post"}
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
