"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";

type EbookOption = { id: string; slug: string; title: string; priceNpr: number };

type CommunityItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImage: string | null;
  status: "ACTIVE" | "ARCHIVED";
  permissions: string;
  ebookLinks: { ebook: { id: string; slug: string; title: string } }[];
  _count: { members: number; messages: number };
};

type MemberItem = {
  id: string;
  role: "ADMIN" | "MODERATOR" | "MEMBER";
  mutedUntil: string | null;
  bannedAt: string | null;
  joinedAt: string;
  user: { id: string; name: string | null; email: string };
};

type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  createdAt: string;
};

type MessageItem = {
  id: string;
  body: string;
  type: string;
  pinnedAt: string | null;
  deletedAt: string | null;
  createdAt: string;
  author: { name: string | null; email: string };
};

function parsePermissions(raw: string) {
  try {
    return JSON.parse(raw) as { text: string; media: string; voice: string };
  } catch {
    return { text: "ALL", media: "ALL", voice: "MODS" };
  }
}

export function CommunityManager({
  initialCommunities,
  ebooks,
}: {
  initialCommunities: CommunityItem[];
  ebooks: EbookOption[];
}) {
  const [communities, setCommunities] = useState(initialCommunities);
  const [selectedId, setSelectedId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [modMessages, setModMessages] = useState<MessageItem[]>([]);
  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "" });
  const [form, setForm] = useState({
    slug: "",
    name: "",
    description: "",
    coverImage: "",
    status: "ACTIVE" as "ACTIVE" | "ARCHIVED",
    text: "ALL",
    media: "ALL",
    voice: "MODS",
    ebookIds: [] as string[],
  });

  const selected = useMemo(
    () => communities.find((item) => item.id === selectedId) ?? null,
    [communities, selectedId],
  );

  const isCreateMode = !selectedId;

  function slugify(value: string) {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  function resetForm() {
    setForm({
      slug: "",
      name: "",
      description: "",
      coverImage: "",
      status: "ACTIVE",
      text: "ALL",
      media: "ALL",
      voice: "MODS",
      ebookIds: [],
    });
    setSelectedId("");
    setMembers([]);
    setAnnouncements([]);
    setModMessages([]);
    setMessage("Ready to create a new community.");
  }

  function loadIntoForm(community: CommunityItem) {
    const permissions = parsePermissions(community.permissions);
    setSelectedId(community.id);
    setForm({
      slug: community.slug,
      name: community.name,
      description: community.description,
      coverImage: community.coverImage ?? "",
      status: community.status,
      text: permissions.text,
      media: permissions.media,
      voice: permissions.voice,
      ebookIds: community.ebookLinks.map((link) => link.ebook.id),
    });
  }

  function mapCommunity(raw: CommunityItem & { ebookLinks?: CommunityItem["ebookLinks"]; _count?: CommunityItem["_count"] }) {
    return {
      id: raw.id,
      slug: raw.slug,
      name: raw.name,
      description: raw.description,
      coverImage: raw.coverImage,
      status: raw.status,
      permissions: typeof raw.permissions === "string" ? raw.permissions : JSON.stringify(raw.permissions ?? {}),
      ebookLinks: raw.ebookLinks ?? [],
      _count: raw._count ?? { members: 0, messages: 0 },
    } satisfies CommunityItem;
  }

  async function uploadCover(file: File | null) {
    if (!file) return;
    const formData = new FormData();
    formData.append("folder", "blog-covers");
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Cover upload failed.");
      return;
    }
    setForm((current) => ({ ...current, coverImage: data.path }));
    setMessage("Cover uploaded.");
  }

  async function refreshList() {
    const response = await fetch("/api/admin/communities");
    const data = await response.json();
    if (response.ok) {
      setCommunities((data.communities ?? []).map(mapCommunity));
    }
  }

  async function saveCommunity(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const slug = form.slug.trim() ? slugify(form.slug) : slugify(form.name);
    if (!form.name.trim() || !slug) {
      setSubmitting(false);
      setMessage("Name and slug are required.");
      return;
    }

    const payload = {
      slug,
      name: form.name.trim(),
      description: form.description,
      coverImage: form.coverImage,
      status: form.status,
      permissions: { text: form.text, media: form.media, voice: form.voice },
      ebookIds: form.ebookIds,
    };

    const response = await fetch(
      isCreateMode ? "/api/admin/communities" : `/api/admin/communities/${selectedId}`,
      {
        method: isCreateMode ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) {
      setMessage(data.error ?? "Unable to save community.");
      return;
    }

    const saved = mapCommunity(data.community);
    setMessage(isCreateMode ? "Community created." : "Community updated.");
    setCommunities((current) => {
      const without = current.filter((item) => item.id !== saved.id);
      return [saved, ...without];
    });
    loadIntoForm(saved);
  }

  async function archiveSelected() {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}`, { method: "DELETE" });
    if (!response.ok) {
      setMessage("Unable to archive community.");
      return;
    }
    setMessage("Community archived.");
    await refreshList();
    resetForm();
  }

  async function loadMembers() {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}/members`);
    const data = await response.json();
    if (response.ok) setMembers(data.members);
  }

  async function loadAnnouncements() {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}/announcements`);
    const data = await response.json();
    if (response.ok) setAnnouncements(data.announcements);
  }

  async function loadMessages() {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}/messages?limit=40`);
    const data = await response.json();
    if (response.ok) setModMessages(data.messages);
  }

  async function memberAction(memberId: string, action: string, extra?: Record<string, unknown>) {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action, ...extra }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Member action failed.");
      return;
    }
    setMessage("Member updated.");
    await loadMembers();
  }

  async function createAnnouncement(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}/announcements`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...announcementForm, pinned: true }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Unable to post announcement.");
      return;
    }
    setAnnouncementForm({ title: "", body: "" });
    setMessage("Announcement pinned.");
    await loadAnnouncements();
  }

  async function moderateMessage(messageId: string, action: "delete" | "pin" | "unpin") {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}/messages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, action }),
    });
    if (!response.ok) {
      setMessage("Unable to moderate message.");
      return;
    }
    setMessage(`Message ${action}d.`);
    await loadMessages();
  }

  function toggleEbook(id: string) {
    setForm((current) => ({
      ...current,
      ebookIds: current.ebookIds.includes(id)
        ? current.ebookIds.filter((item) => item !== id)
        : [...current.ebookIds, id],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {communities.map((community) => (
          <button
            key={community.id}
            type="button"
            onClick={() => loadIntoForm(community)}
            className={`rounded-2xl border p-4 text-left transition ${
              selectedId === community.id
                ? "border-primary bg-primary/5"
                : "border-outline-variant/40 bg-white hover:border-primary/40"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{community.status}</p>
            <p className="mt-1 font-semibold text-on-background">{community.name}</p>
            <p className="mt-1 text-xs text-on-surface-variant">
              {community._count.members} members · {community._count.messages} messages
            </p>
          </button>
        ))}
      </div>

      <form onSubmit={saveCommunity} className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-headline-md text-on-background">
            {isCreateMode ? "Create community" : "Edit community"}
          </h2>
          <Button type="button" variant="outline" onClick={resetForm}>
            New community
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Name</span>
            <input
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((current) => ({
                  ...current,
                  name,
                  slug: isCreateMode ? slugify(name) : current.slug,
                }));
              }}
              className="w-full rounded-xl border border-outline-variant/50 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Slug</span>
            <input
              required
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
              className="w-full rounded-xl border border-outline-variant/50 px-3 py-2"
              placeholder="my-community"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-outline-variant/50 px-3 py-2"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Cover image path</span>
            <input
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              className="w-full rounded-xl border border-outline-variant/50 px-3 py-2"
            />
            <input
              type="file"
              accept="image/*"
              className="mt-2 block w-full text-xs"
              onChange={(e) => uploadCover(e.target.files?.[0] ?? null)}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Status</span>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as "ACTIVE" | "ARCHIVED" })}
              className="w-full rounded-xl border border-outline-variant/50 px-3 py-2"
            >
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(["text", "media", "voice"] as const).map((key) => (
            <label key={key} className="block text-sm">
              <span className="mb-1 block font-medium capitalize">{key} permission</span>
              <select
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-xl border border-outline-variant/50 px-3 py-2"
              >
                <option value="ALL">All members</option>
                <option value="MODS">Mods+</option>
                <option value="ADMIN">Admins only</option>
              </select>
            </label>
          ))}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium">Linked packages (ebooks)</p>
          <div className="grid gap-2 md:grid-cols-2">
            {ebooks.map((ebook) => (
              <label key={ebook.id} className="flex items-center gap-2 rounded-xl border border-outline-variant/30 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.ebookIds.includes(ebook.id)}
                  onChange={() => toggleEbook(ebook.id)}
                />
                <span>
                  {ebook.title} · NPR {ebook.priceNpr}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Saving..." : isCreateMode ? "Create community" : "Update community"}
          </Button>
          {selectedId && (
            <Button type="button" variant="outline" onClick={archiveSelected}>
              Archive
            </Button>
          )}
        </div>
      </form>

      {selected && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-outline-variant/30 bg-white p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-headline-md text-on-background">Members ({selected._count.members})</h3>
              <Button type="button" variant="outline" size="sm" onClick={loadMembers}>
                Load members
              </Button>
            </div>
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-outline-variant/20 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold">{member.user.name ?? "Member"}</p>
                    <p className="text-xs text-on-surface-variant">
                      {member.user.email} · {member.role}
                      {member.bannedAt ? " · banned" : ""}
                      {member.mutedUntil ? " · muted" : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => memberAction(member.id, "role", { role: "MODERATOR" })}>
                      Make mod
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => memberAction(member.id, "mute", { muteHours: 24 })}>
                      Mute 24h
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => memberAction(member.id, "unmute")}>
                      Unmute
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => memberAction(member.id, "ban")}>
                      Ban
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => memberAction(member.id, "unban")}>
                      Unban
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => memberAction(member.id, "remove")}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <p className="text-sm text-on-surface-variant">Click “Load members” to review membership.</p>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-outline-variant/30 bg-white p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-headline-md text-on-background">Announcements</h3>
              <Button type="button" variant="outline" size="sm" onClick={loadAnnouncements}>
                Refresh
              </Button>
            </div>
            <form onSubmit={createAnnouncement} className="mb-4 space-y-3">
              <input
                required
                placeholder="Title"
                value={announcementForm.title}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                className="w-full rounded-xl border border-outline-variant/50 px-3 py-2 text-sm"
              />
              <textarea
                required
                placeholder="Announcement body"
                value={announcementForm.body}
                onChange={(e) => setAnnouncementForm({ ...announcementForm, body: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-outline-variant/50 px-3 py-2 text-sm"
              />
              <Button type="submit" size="sm">
                Pin announcement
              </Button>
            </form>
            <div className="space-y-2">
              {announcements.map((item) => (
                <div key={item.id} className="rounded-xl border border-outline-variant/20 px-3 py-2 text-sm">
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-on-surface-variant">{item.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-outline-variant/30 bg-white p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-headline-md text-on-background">Moderate messages</h3>
              <Button type="button" variant="outline" size="sm" onClick={loadMessages}>
                Load recent
              </Button>
            </div>
            <div className="space-y-2">
              {modMessages.map((item) => (
                <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-outline-variant/20 px-3 py-2 text-sm">
                  <div>
                    <p className="font-semibold">{item.author.name ?? item.author.email}</p>
                    <p className="text-on-surface-variant">
                      {item.deletedAt ? "[deleted]" : item.body || `[${item.type}]`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" variant="outline" onClick={() => moderateMessage(item.id, item.pinnedAt ? "unpin" : "pin")}>
                      {item.pinnedAt ? "Unpin" : "Pin"}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => moderateMessage(item.id, "delete")}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {message && <p className="text-sm text-on-surface-variant">{message}</p>}
    </div>
  );
}
