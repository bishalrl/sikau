"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Attachment = {
  id: string;
  path: string;
  mime: string;
  size: number;
  name: string;
};

type ChatMessage = {
  id: string;
  body: string;
  type: string;
  createdAt: string;
  pinnedAt: string | null;
  author: { id: string; name: string | null; email: string };
  attachments: Attachment[];
  reactions: { id: string; emoji: string; userId: string }[];
  replyTo: {
    id: string;
    body: string;
    type: string;
    deletedAt: string | null;
    author: { id: string; name: string | null };
  } | null;
};

type Props = {
  community: {
    id: string;
    slug: string;
    name: string;
    description: string;
    coverImage: string | null;
  };
  currentUserId: string;
  announcements: { id: string; title: string; body: string }[];
};

function dayKey(value: string) {
  return new Date(value).toDateString();
}

function formatDay(value: string) {
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function CommunityChat({ community, currentUserId, announcements }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pinned, setPinned] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [search, setSearch] = useState("");
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const newestId = messages[messages.length - 1]?.id;

  const mergeMessages = useCallback((incoming: ChatMessage[], mode: "replace" | "prepend" | "append") => {
    setMessages((current) => {
      const map = new Map<string, ChatMessage>();
      const ordered =
        mode === "prepend"
          ? [...incoming, ...current]
          : mode === "append"
            ? [...current, ...incoming]
            : incoming;
      for (const item of ordered) map.set(item.id, item);
      return Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
  }, []);

  const loadInitial = useCallback(async () => {
    const [msgRes, pinRes] = await Promise.all([
      fetch(`/api/community/${community.id}/messages?limit=40`),
      fetch(`/api/community/${community.id}/messages?pinned=1`),
    ]);
    const msgData = await msgRes.json();
    const pinData = await pinRes.json();
    if (msgRes.ok) {
      mergeMessages(msgData.messages ?? [], "replace");
      setHasMore((msgData.messages ?? []).length >= 40);
    }
    if (pinRes.ok) setPinned(pinData.messages ?? []);
    await fetch(`/api/community/${community.id}/read`, { method: "POST" });
  }, [community.id, mergeMessages]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!newestId) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/community/${community.id}/messages?after=${newestId}&limit=50`);
      const data = await response.json();
      if (response.ok && data.messages?.length) {
        mergeMessages(data.messages, "append");
        await fetch(`/api/community/${community.id}/read`, { method: "POST" });
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [community.id, newestId, mergeMessages]);

  async function loadOlder() {
    if (!messages[0] || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const previousHeight = listRef.current?.scrollHeight ?? 0;
    const response = await fetch(
      `/api/community/${community.id}/messages?before=${messages[0].id}&limit=40`,
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

  async function uploadAndSend(file: File) {
    setSending(true);
    setError("");
    const formData = new FormData();
    formData.append("folder", "community-media");
    formData.append("communityId", community.id);
    formData.append("file", file);
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      setSending(false);
      setError(uploadData.error ?? "Upload failed.");
      return;
    }

    const type = file.type.startsWith("image/")
      ? "IMAGE"
      : file.type.startsWith("video/")
        ? "VIDEO"
        : file.type.startsWith("audio/")
          ? "AUDIO"
          : "FILE";

    const response = await fetch(`/api/community/${community.id}/messages`, {
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
      setError(data.error ?? "Unable to send.");
      return;
    }
    setBody("");
    setReplyTo(null);
    mergeMessages([data.message], "append");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function sendText(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    setError("");
    const response = await fetch(`/api/community/${community.id}/messages`, {
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
      setError(data.error ?? "Unable to send.");
      return;
    }
    setBody("");
    setReplyTo(null);
    mergeMessages([data.message], "append");
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  async function runAction(messageId: string, action: string, emoji?: string) {
    const response = await fetch(`/api/community/${community.id}/actions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, action, emoji }),
    });
    if (!response.ok) return;
    if (action === "delete") {
      setMessages((current) => current.filter((item) => item.id !== messageId));
      return;
    }
    await loadInitial();
  }

  async function searchMessages(event: React.FormEvent) {
    event.preventDefault();
    if (!search.trim()) {
      await loadInitial();
      return;
    }
    const response = await fetch(
      `/api/community/${community.id}/messages?q=${encodeURIComponent(search.trim())}&limit=50`,
    );
    const data = await response.json();
    if (response.ok) mergeMessages(data.messages ?? [], "replace");
  }

  const timeline = useMemo(() => {
    const rows: Array<{ kind: "day"; label: string } | { kind: "message"; message: ChatMessage }> = [];
    let lastDay = "";
    for (const message of messages) {
      const key = dayKey(message.createdAt);
      if (key !== lastDay) {
        rows.push({ kind: "day", label: formatDay(message.createdAt) });
        lastDay = key;
      }
      rows.push({ kind: "message", message });
    }
    return rows;
  }, [messages]);

  return (
    <div className="community-chat">
      <header className="community-chat__header">
        <Link href="/community" className="community-chat__back">
          ←
        </Link>
        <div className="community-chat__avatar">
          {community.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={community.coverImage} alt="" />
          ) : (
            <span>{community.name.slice(0, 1)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="community-chat__title">{community.name}</h1>
          <p className="community-chat__subtitle">{community.description || "Community chat"}</p>
        </div>
      </header>

      <form onSubmit={searchMessages} className="community-chat__search">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search messages"
        />
        <button type="submit">Search</button>
      </form>

      {(announcements.length > 0 || pinned.length > 0) && (
        <div className="community-chat__pins">
          {announcements.map((item) => (
            <div key={item.id} className="community-chat__pin">
              <strong>{item.title}</strong>
              <span>{item.body}</span>
            </div>
          ))}
          {pinned.map((item) => (
            <div key={item.id} className="community-chat__pin">
              <strong>Pinned</strong>
              <span>{item.body || `[${item.type}]`}</span>
            </div>
          ))}
        </div>
      )}

      <div ref={listRef} className="community-chat__messages">
        {hasMore && (
          <button type="button" className="community-chat__load-older" onClick={loadOlder} disabled={loadingOlder}>
            {loadingOlder ? "Loading…" : "Load earlier messages"}
          </button>
        )}

        {timeline.map((row) =>
          row.kind === "day" ? (
            <div key={row.label} className="community-chat__day">
              {row.label}
            </div>
          ) : (
            <article
              key={row.message.id}
              className={`community-bubble ${
                row.message.author.id === currentUserId ? "is-mine" : "is-theirs"
              }`}
            >
              {row.message.author.id !== currentUserId && (
                <p className="community-bubble__author">{row.message.author.name ?? "Member"}</p>
              )}
              {row.message.replyTo && (
                <div className="community-bubble__reply">
                  <span>{row.message.replyTo.author.name ?? "Member"}</span>
                  <p>{row.message.replyTo.deletedAt ? "Original removed" : row.message.replyTo.body}</p>
                </div>
              )}
              {row.message.attachments.map((file) => (
                <div key={file.id} className="community-bubble__media">
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
              {row.message.body && <p className="community-bubble__text">{row.message.body}</p>}
              <div className="community-bubble__meta">
                <span>{formatTime(row.message.createdAt)}</span>
                {row.message.pinnedAt && <span>Pinned</span>}
              </div>
              {row.message.reactions.length > 0 && (
                <div className="community-bubble__reactions">
                  {Object.entries(
                    row.message.reactions.reduce<Record<string, number>>((acc, reaction) => {
                      acc[reaction.emoji] = (acc[reaction.emoji] ?? 0) + 1;
                      return acc;
                    }, {}),
                  ).map(([emoji, count]) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => runAction(row.message.id, "react", emoji)}
                    >
                      {emoji} {count}
                    </button>
                  ))}
                </div>
              )}
              <div className="community-bubble__actions">
                <button type="button" onClick={() => setReplyTo(row.message)}>
                  Reply
                </button>
                <button type="button" onClick={() => runAction(row.message.id, "react", "👍")}>
                  👍
                </button>
                <button type="button" onClick={() => runAction(row.message.id, "react", "🔥")}>
                  🔥
                </button>
                <button type="button" onClick={() => runAction(row.message.id, "pin")}>
                  Pin
                </button>
                <button type="button" onClick={() => runAction(row.message.id, "delete")}>
                  Delete
                </button>
              </div>
            </article>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="community-chat__replying">
          <div>
            <strong>Replying to {replyTo.author.name ?? "Member"}</strong>
            <p>{replyTo.body || `[${replyTo.type}]`}</p>
          </div>
          <button type="button" onClick={() => setReplyTo(null)}>
            ✕
          </button>
        </div>
      )}

      <form className="community-chat__composer" onSubmit={sendText}>
        <label className="community-chat__attach">
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
          placeholder="Type a message"
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !body.trim()}>
          Send
        </Button>
      </form>
      {error && <p className="community-chat__error">{error}</p>}
    </div>
  );
}
