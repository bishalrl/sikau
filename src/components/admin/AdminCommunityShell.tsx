"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

export type AdminCommunityItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImage: string | null;
  status: "ACTIVE" | "ARCHIVED";
  permissions: string;
  ebookLinks: { ebook: { id: string; slug: string; title: string } }[];
  _count: { members: number; messages: number };
  lastMessage: {
    id: string;
    body: string;
    type: string;
    createdAt: string;
    authorName: string;
  } | null;
};

type EbookOption = { id: string; slug: string; title: string; priceNpr: number };

type ChatMessage = {
  id: string;
  body: string;
  type: string;
  createdAt: string;
  pinnedAt: string | null;
  deletedAt?: string | null;
  author: { id: string; name: string | null; email: string };
  attachments: { id: string; path: string; mime: string; name: string }[];
  reactions: { id: string; emoji: string; userId: string }[];
  replyTo: {
    id: string;
    body: string;
    type: string;
    deletedAt: string | null;
    author: { id: string; name: string | null };
  } | null;
};

type MemberItem = {
  id: string;
  role: "ADMIN" | "MODERATOR" | "MEMBER";
  mutedUntil: string | null;
  bannedAt: string | null;
  user: { id: string; name: string | null; email: string };
};

type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
};

type Panel = "none" | "settings" | "members" | "announcements" | "create";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parsePermissions(raw: string) {
  try {
    return JSON.parse(raw) as { text: string; media: string; voice: string };
  } catch {
    return { text: "ALL", media: "ALL", voice: "MODS" };
  }
}

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function dayLabel(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function normalizeCommunity(raw: Record<string, unknown>): AdminCommunityItem {
  const ebookLinks = Array.isArray(raw.ebookLinks) ? raw.ebookLinks : [];
  const count = (raw._count as { members?: number; messages?: number } | undefined) ?? {};
  const last = raw.lastMessage as AdminCommunityItem["lastMessage"] | null | undefined;
  return {
    id: String(raw.id ?? ""),
    slug: String(raw.slug ?? ""),
    name: String(raw.name ?? "Untitled"),
    description: String(raw.description ?? ""),
    coverImage: (raw.coverImage as string | null) ?? null,
    status: raw.status === "ARCHIVED" ? "ARCHIVED" : "ACTIVE",
    permissions:
      typeof raw.permissions === "string"
        ? raw.permissions
        : JSON.stringify(raw.permissions ?? { text: "ALL", media: "ALL", voice: "MODS" }),
    ebookLinks: ebookLinks.map((link) => {
      const item = link as { ebook?: { id: string; slug: string; title: string } };
      return {
        ebook: {
          id: item.ebook?.id ?? "",
          slug: item.ebook?.slug ?? "",
          title: item.ebook?.title ?? "",
        },
      };
    }),
    _count: {
      members: Number(count.members ?? 0),
      messages: Number(count.messages ?? 0),
    },
    lastMessage: last
      ? {
          ...last,
          createdAt:
            typeof last.createdAt === "string"
              ? last.createdAt
              : new Date(last.createdAt as unknown as string).toISOString(),
        }
      : null,
  };
}

export function AdminCommunityShell({
  initialCommunities,
  ebooks,
  currentUserId,
}: {
  initialCommunities: AdminCommunityItem[];
  ebooks: EbookOption[];
  currentUserId: string;
}) {
  const [communities, setCommunities] = useState(initialCommunities);
  const [selectedId, setSelectedId] = useState(initialCommunities.find((c) => c.status === "ACTIVE")?.id ?? "");
  const [panel, setPanel] = useState<Panel>("none");
  const [query, setQuery] = useState("");
  const [statusMsg, setStatusMsg] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinned, setPinned] = useState<ChatMessage[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [chatError, setChatError] = useState("");

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
  const [announcementForm, setAnnouncementForm] = useState({ title: "", body: "" });
  const [saving, setSaving] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selected = communities.find((item) => item.id === selectedId) ?? null;
  const newestId = messages[messages.length - 1]?.id;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = !q
      ? communities
      : communities.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.slug.toLowerCase().includes(q) ||
            item.description.toLowerCase().includes(q),
        );
    return {
      active: list.filter((item) => item.status === "ACTIVE"),
      archived: list.filter((item) => item.status === "ARCHIVED"),
    };
  }, [communities, query]);

  const timeline = useMemo(() => {
    const rows: Array<{ kind: "day"; label: string } | { kind: "message"; message: ChatMessage }> = [];
    let lastDay = "";
    for (const message of messages) {
      const key = new Date(message.createdAt).toDateString();
      if (key !== lastDay) {
        rows.push({ kind: "day", label: dayLabel(message.createdAt) });
        lastDay = key;
      }
      rows.push({ kind: "message", message });
    }
    return rows;
  }, [messages]);

  const mergeMessages = useCallback((incoming: ChatMessage[], mode: "replace" | "prepend" | "append") => {
    setMessages((current) => {
      const map = new Map<string, ChatMessage>();
      const ordered =
        mode === "prepend" ? [...incoming, ...current] : mode === "append" ? [...current, ...incoming] : incoming;
      for (const item of ordered) {
        if (!item.deletedAt) map.set(item.id, item);
      }
      return Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, []);

  async function refreshCommunities(preferId?: string) {
    const response = await fetch("/api/admin/communities");
    const data = await response.json();
    if (!response.ok) {
      setStatusMsg(data.error ?? "Unable to refresh communities.");
      return;
    }
    const next = (data.communities ?? []).map((item: Record<string, unknown>) => normalizeCommunity(item));
    setCommunities(next);
    if (preferId && next.some((item: AdminCommunityItem) => item.id === preferId)) {
      setSelectedId(preferId);
    } else if (selectedId && !next.some((item: AdminCommunityItem) => item.id === selectedId)) {
      setSelectedId(next.find((item: AdminCommunityItem) => item.status === "ACTIVE")?.id ?? "");
    }
  }

  const loadChat = useCallback(
    async (communityId: string) => {
      setChatError("");
      const [msgRes, pinRes, annRes] = await Promise.all([
        fetch(`/api/admin/communities/${communityId}/messages?limit=40`),
        fetch(`/api/admin/communities/${communityId}/messages?pinned=1`),
        fetch(`/api/admin/communities/${communityId}/announcements`),
      ]);
      const msgData = await msgRes.json();
      const pinData = await pinRes.json();
      const annData = await annRes.json();
      if (msgRes.ok) {
        mergeMessages(msgData.messages ?? [], "replace");
        setHasMore((msgData.messages ?? []).length >= 40);
      } else {
        setChatError(msgData.error ?? "Unable to load messages.");
      }
      if (pinRes.ok) setPinned(pinData.messages ?? []);
      if (annRes.ok) setAnnouncements(annData.announcements ?? []);
    },
    [mergeMessages],
  );

  useEffect(() => {
    if (!selectedId || panel === "create") return;
    loadChat(selectedId);
  }, [selectedId, panel, loadChat]);

  useEffect(() => {
    if (!selectedId || !newestId || panel === "create") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(
        `/api/admin/communities/${selectedId}/messages?after=${newestId}&limit=50`,
      );
      const data = await response.json();
      if (response.ok && data.messages?.length) {
        mergeMessages(data.messages, "append");
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        refreshCommunities(selectedId);
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [selectedId, newestId, panel, mergeMessages]);

  function openCreate() {
    setPanel("create");
    setSelectedId("");
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
    setStatusMsg("");
  }

  function openCommunity(community: AdminCommunityItem) {
    setSelectedId(community.id);
    setPanel("none");
    const permissions = parsePermissions(community.permissions);
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

  async function saveCommunity(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setStatusMsg("");
    const slug = form.slug.trim() ? slugify(form.slug) : slugify(form.name);
    if (!form.name.trim() || !slug) {
      setSaving(false);
      setStatusMsg("Name and slug are required.");
      return;
    }

    const isCreate = panel === "create" || !selectedId;
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
      isCreate ? "/api/admin/communities" : `/api/admin/communities/${selectedId}`,
      {
        method: isCreate ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    const data = await response.json();
    setSaving(false);
    if (!response.ok) {
      setStatusMsg(data.error ?? "Unable to save community.");
      return;
    }

    const saved = normalizeCommunity(data.community);
    setCommunities((current) => {
      const without = current.filter((item) => item.id !== saved.id);
      return [saved, ...without];
    });
    await refreshCommunities(saved.id);
    setSelectedId(saved.id);
    setPanel("none");
    setStatusMsg(isCreate ? "Community created." : "Community updated.");
  }

  async function archiveCommunity() {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}`, { method: "DELETE" });
    if (!response.ok) {
      setStatusMsg("Unable to archive community.");
      return;
    }
    setStatusMsg("Community archived.");
    await refreshCommunities();
    setPanel("none");
  }

  async function uploadCover(file: File | null) {
    if (!file) return;
    const formData = new FormData();
    formData.append("folder", "blog-covers");
    formData.append("file", file);
    const response = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) {
      setStatusMsg(data.error ?? "Cover upload failed.");
      return;
    }
    setForm((current) => ({ ...current, coverImage: data.path }));
  }

  async function loadOlder() {
    if (!selectedId || !messages[0] || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const previousHeight = listRef.current?.scrollHeight ?? 0;
    const response = await fetch(
      `/api/admin/communities/${selectedId}/messages?before=${messages[0].id}&limit=40`,
    );
    const data = await response.json();
    setLoadingOlder(false);
    if (!response.ok) return;
    const older = data.messages ?? [];
    setHasMore(older.length >= 40);
    mergeMessages(older, "prepend");
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight - previousHeight;
      }
    });
  }

  async function sendText(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedId || !body.trim()) return;
    setSending(true);
    setChatError("");
    const response = await fetch(`/api/admin/communities/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "TEXT",
        body: body.trim(),
        replyToId: replyTo?.id,
      }),
    });
    const data = await response.json();
    setSending(false);
    if (!response.ok) {
      setChatError(data.error ?? "Unable to send.");
      return;
    }
    setBody("");
    setReplyTo(null);
    mergeMessages([data.message], "append");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    refreshCommunities(selectedId);
  }

  async function uploadAndSend(file: File) {
    if (!selectedId) return;
    setSending(true);
    setChatError("");
    const formData = new FormData();
    formData.append("folder", "community-media");
    formData.append("communityId", selectedId);
    formData.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      setSending(false);
      setChatError(uploadData.error ?? "Upload failed.");
      return;
    }
    const type = file.type.startsWith("image/")
      ? "IMAGE"
      : file.type.startsWith("video/")
        ? "VIDEO"
        : file.type.startsWith("audio/")
          ? "AUDIO"
          : "FILE";
    const response = await fetch(`/api/admin/communities/${selectedId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        body: body.trim() || file.name,
        replyToId: replyTo?.id,
        attachments: [
          {
            path: uploadData.path,
            mime: uploadData.mime,
            size: uploadData.size,
            name: uploadData.name,
          },
        ],
      }),
    });
    const data = await response.json();
    setSending(false);
    if (!response.ok) {
      setChatError(data.error ?? "Unable to send.");
      return;
    }
    setBody("");
    setReplyTo(null);
    mergeMessages([data.message], "append");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function moderate(messageId: string, action: "delete" | "pin" | "unpin") {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}/messages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, action }),
    });
    if (!response.ok) return;
    if (action === "delete") {
      setMessages((current) => current.filter((item) => item.id !== messageId));
    } else {
      await loadChat(selectedId);
    }
  }

  async function loadMembers() {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}/members`);
    const data = await response.json();
    if (response.ok) setMembers(data.members ?? []);
  }

  async function memberAction(memberId: string, action: string, extra?: Record<string, unknown>) {
    if (!selectedId) return;
    const response = await fetch(`/api/admin/communities/${selectedId}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action, ...extra }),
    });
    if (!response.ok) {
      const data = await response.json();
      setStatusMsg(data.error ?? "Member action failed.");
      return;
    }
    await loadMembers();
    await refreshCommunities(selectedId);
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
      setStatusMsg(data.error ?? "Unable to post announcement.");
      return;
    }
    setAnnouncementForm({ title: "", body: "" });
    setAnnouncements((current) => [data.announcement, ...current]);
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
    <div className="admin-community-shell">
      <aside className="admin-community-shell__list">
        <div className="admin-community-shell__list-head">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search communities"
            className="admin-community-shell__search"
          />
          <Button type="button" size="sm" onClick={openCreate}>
            New
          </Button>
        </div>

        {filtered.active.length === 0 && filtered.archived.length === 0 && (
          <div className="admin-community-shell__empty">
            <p>No communities yet.</p>
            <Button type="button" size="sm" onClick={openCreate}>
              Create community
            </Button>
          </div>
        )}

        {filtered.active.map((community) => (
          <button
            key={community.id}
            type="button"
            className={`admin-community-shell__row ${selectedId === community.id && panel !== "create" ? "is-active" : ""}`}
            onClick={() => openCommunity(community)}
          >
            <div className="admin-community-shell__avatar">
              {community.coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={community.coverImage} alt="" />
              ) : (
                <span>{community.name.slice(0, 1)}</span>
              )}
            </div>
            <div className="admin-community-shell__row-body">
              <div className="admin-community-shell__row-top">
                <strong>{community.name}</strong>
                <span>{formatTime(community.lastMessage?.createdAt)}</span>
              </div>
              <p>
                {community.lastMessage
                  ? `${community.lastMessage.authorName}: ${
                      community.lastMessage.body || `[${community.lastMessage.type}]`
                    }`
                  : `${community._count.members} members · no messages yet`}
              </p>
            </div>
          </button>
        ))}

        {filtered.archived.length > 0 && (
          <>
            <p className="admin-community-shell__section">Archived</p>
            {filtered.archived.map((community) => (
              <button
                key={community.id}
                type="button"
                className={`admin-community-shell__row is-archived ${selectedId === community.id ? "is-active" : ""}`}
                onClick={() => openCommunity(community)}
              >
                <div className="admin-community-shell__avatar">
                  <span>{community.name.slice(0, 1)}</span>
                </div>
                <div className="admin-community-shell__row-body">
                  <strong>{community.name}</strong>
                  <p>Archived · {community._count.members} members</p>
                </div>
              </button>
            ))}
          </>
        )}
      </aside>

      <section className="admin-community-shell__main">
        {panel === "create" || (!selected && panel === "settings") ? (
          <form className="admin-community-shell__form" onSubmit={saveCommunity}>
            <div className="admin-community-shell__form-head">
              <h2>{panel === "create" ? "Create community" : "Community settings"}</h2>
              {selected && (
                <Button type="button" variant="outline" size="sm" onClick={() => setPanel("none")}>
                  Back to chat
                </Button>
              )}
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
                      slug: panel === "create" ? slugify(name) : current.slug,
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
                <span className="mb-1 block font-medium">Cover</span>
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
              <p className="mb-2 text-sm font-medium">Linked packages</p>
              <div className="grid gap-2 md:grid-cols-2">
                {ebooks.map((ebook) => (
                  <label
                    key={ebook.id}
                    className="flex items-center gap-2 rounded-xl border border-outline-variant/30 px-3 py-2 text-sm"
                  >
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
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : panel === "create" ? "Create community" : "Save settings"}
              </Button>
              {panel !== "create" && selected && (
                <Button type="button" variant="outline" onClick={archiveCommunity}>
                  Archive
                </Button>
              )}
            </div>
            {statusMsg && <p className="text-sm text-on-surface-variant">{statusMsg}</p>}
          </form>
        ) : selected ? (
          <div className="admin-community-chat">
            <header className="admin-community-chat__header">
              <div className="admin-community-shell__avatar">
                {selected.coverImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.coverImage} alt="" />
                ) : (
                  <span>{selected.name.slice(0, 1)}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2>{selected.name}</h2>
                <p>
                  {selected._count.members} members · {selected._count.messages} messages
                </p>
              </div>
              <div className="admin-community-chat__actions">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPanel("members");
                    loadMembers();
                  }}
                >
                  Members
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setPanel("announcements")}>
                  Announcements
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    openCommunity(selected);
                    setPanel("settings");
                  }}
                >
                  Settings
                </Button>
              </div>
            </header>

            {panel === "members" && (
              <div className="admin-community-panel">
                <div className="admin-community-panel__head">
                  <h3>Members</h3>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setPanel("none")}>
                    Close
                  </Button>
                </div>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div key={member.id} className="admin-community-panel__row">
                      <div>
                        <p className="font-semibold">{member.user.name ?? "Member"}</p>
                        <p className="text-xs text-on-surface-variant">
                          {member.user.email} · {member.role}
                          {member.bannedAt ? " · banned" : ""}
                          {member.mutedUntil ? " · muted" : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="outline" onClick={() => memberAction(member.id, "role", { role: "MODERATOR" })}>
                          Mod
                        </Button>
                        <Button type="button" size="sm" variant="outline" onClick={() => memberAction(member.id, "mute", { muteHours: 24 })}>
                          Mute
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
                  {members.length === 0 && <p className="text-sm text-on-surface-variant">No members loaded.</p>}
                </div>
              </div>
            )}

            {panel === "announcements" && (
              <div className="admin-community-panel">
                <div className="admin-community-panel__head">
                  <h3>Announcements</h3>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setPanel("none")}>
                    Close
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
            )}

            {panel === "settings" && (
              <div className="admin-community-panel">
                <div className="admin-community-panel__head">
                  <h3>Settings</h3>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setPanel("none")}>
                    Close
                  </Button>
                </div>
                <form className="space-y-4" onSubmit={saveCommunity}>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full rounded-xl border border-outline-variant/50 px-3 py-2"
                    placeholder="Name"
                  />
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full rounded-xl border border-outline-variant/50 px-3 py-2"
                    placeholder="Description"
                  />
                  <div className="grid gap-2 md:grid-cols-2">
                    {ebooks.map((ebook) => (
                      <label key={ebook.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={form.ebookIds.includes(ebook.id)}
                          onChange={() => toggleEbook(ebook.id)}
                        />
                        {ebook.title}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={saving}>
                      Save
                    </Button>
                    <Button type="button" size="sm" variant="outline" onClick={archiveCommunity}>
                      Archive
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {(announcements.length > 0 || pinned.length > 0) && panel === "none" && (
              <div className="admin-community-chat__pins">
                {announcements.slice(0, 3).map((item) => (
                  <div key={item.id}>
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </div>
                ))}
                {pinned.slice(0, 3).map((item) => (
                  <div key={item.id}>
                    <strong>Pinned</strong>
                    <span>{item.body || `[${item.type}]`}</span>
                  </div>
                ))}
              </div>
            )}

            <div ref={listRef} className="admin-community-chat__messages">
              {hasMore && (
                <button type="button" className="admin-community-chat__older" onClick={loadOlder} disabled={loadingOlder}>
                  {loadingOlder ? "Loading…" : "Load earlier messages"}
                </button>
              )}
              {timeline.map((row) =>
                row.kind === "day" ? (
                  <div key={row.label} className="admin-community-chat__day">
                    {row.label}
                  </div>
                ) : (
                  <article
                    key={row.message.id}
                    className={`admin-bubble ${row.message.author.id === currentUserId ? "is-mine" : "is-theirs"}`}
                  >
                    {row.message.author.id !== currentUserId && (
                      <p className="admin-bubble__author">{row.message.author.name ?? row.message.author.email}</p>
                    )}
                    {row.message.replyTo && (
                      <div className="admin-bubble__reply">
                        <span>{row.message.replyTo.author.name ?? "Member"}</span>
                        <p>{row.message.replyTo.deletedAt ? "Original removed" : row.message.replyTo.body}</p>
                      </div>
                    )}
                    {row.message.attachments.map((file) => (
                      <div key={file.id} className="admin-bubble__media">
                        {file.mime.startsWith("image/") ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={file.path} alt={file.name} />
                        ) : file.mime.startsWith("video/") ? (
                          <video src={file.path} controls preload="metadata" />
                        ) : file.mime.startsWith("audio/") ? (
                          <audio src={file.path} controls preload="metadata" />
                        ) : (
                          <a href={file.path} target="_blank" rel="noreferrer">
                            {file.name}
                          </a>
                        )}
                      </div>
                    ))}
                    {row.message.body && <p className="admin-bubble__text">{row.message.body}</p>}
                    <div className="admin-bubble__meta">
                      <span>{formatTime(row.message.createdAt)}</span>
                      {row.message.pinnedAt && <span>Pinned</span>}
                    </div>
                    <div className="admin-bubble__actions">
                      <button type="button" onClick={() => setReplyTo(row.message)}>
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => moderate(row.message.id, row.message.pinnedAt ? "unpin" : "pin")}
                      >
                        {row.message.pinnedAt ? "Unpin" : "Pin"}
                      </button>
                      <button type="button" onClick={() => moderate(row.message.id, "delete")}>
                        Delete
                      </button>
                    </div>
                  </article>
                ),
              )}
              <div ref={bottomRef} />
            </div>

            {replyTo && (
              <div className="admin-community-chat__replying">
                <div>
                  <strong>Replying to {replyTo.author.name ?? "Member"}</strong>
                  <p>{replyTo.body || `[${replyTo.type}]`}</p>
                </div>
                <button type="button" onClick={() => setReplyTo(null)}>
                  ✕
                </button>
              </div>
            )}

            <form className="admin-community-chat__composer" onSubmit={sendText}>
              <label className="admin-community-chat__attach">
                +
                <input
                  type="file"
                  hidden
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAndSend(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <input
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Message as admin"
                disabled={sending}
              />
              <Button type="submit" disabled={sending || !body.trim()}>
                Send
              </Button>
            </form>
            {chatError && <p className="admin-community-chat__error">{chatError}</p>}
            {statusMsg && panel === "none" && <p className="admin-community-chat__error">{statusMsg}</p>}
          </div>
        ) : (
          <div className="admin-community-shell__placeholder">
            <h2>Select a community</h2>
            <p>Open a WhatsApp-style group chat, or create a new community.</p>
            <Button type="button" onClick={openCreate}>
              Create community
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
