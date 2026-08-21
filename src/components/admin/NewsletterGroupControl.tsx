"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type Attachment = {
  id?: string;
  path: string;
  mime: string;
  name: string;
};

type ChatMessage = {
  id: string;
  body: string;
  type: string;
  createdAt: string;
  author: { id: string; name: string | null };
  attachments?: Attachment[];
};

export function NewsletterGroupControl({
  communityId,
  communityName,
  communitySlug,
}: {
  communityId: string;
  communityName: string;
  communitySlug: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const newestId = messages[messages.length - 1]?.id;

  const loadInitial = useCallback(async () => {
    const response = await fetch(`/api/admin/communities/${communityId}/messages?limit=40`);
    const data = await response.json();
    if (response.ok) {
      const items = (data.messages ?? []) as ChatMessage[];
      setMessages(items);
      setHasMore(items.length >= 40);
    } else {
      setError(data.error ?? "Unable to load messages.");
    }
  }, [communityId]);

  useEffect(() => {
    void loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    if (!newestId) return;
    const timer = window.setInterval(async () => {
      const response = await fetch(
        `/api/admin/communities/${communityId}/messages?after=${newestId}&limit=50`,
      );
      const data = await response.json();
      if (response.ok && data.messages?.length) {
        setMessages((current) => {
          const map = new Map(current.map((item) => [item.id, item]));
          for (const item of data.messages as ChatMessage[]) map.set(item.id, item);
          return Array.from(map.values()).sort(
            (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
          );
        });
      }
    }, 2000);
    return () => window.clearInterval(timer);
  }, [communityId, newestId]);

  async function loadOlder() {
    if (!messages[0] || loadingOlder || !hasMore) return;
    setLoadingOlder(true);
    const previousHeight = listRef.current?.scrollHeight ?? 0;
    const previousTop = listRef.current?.scrollTop ?? 0;
    const response = await fetch(
      `/api/admin/communities/${communityId}/messages?before=${messages[0].id}&limit=40`,
    );
    const data = await response.json();
    setLoadingOlder(false);
    if (!response.ok) return;
    const older = (data.messages ?? []) as ChatMessage[];
    setHasMore(older.length >= 40);
    if (!older.length) {
      setHasMore(false);
      return;
    }
    setMessages((current) => {
      const map = new Map<string, ChatMessage>();
      for (const item of [...older, ...current]) map.set(item.id, item);
      return Array.from(map.values()).sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    });
    requestAnimationFrame(() => {
      if (listRef.current) {
        listRef.current.scrollTop = previousTop + (listRef.current.scrollHeight - previousHeight);
      }
    });
  }

  async function sendUpdate(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim() && !file) return;
    setSending(true);
    setError("");

    try {
      let attachments: Array<{ path: string; mime: string; size: number; name: string }> = [];
      let type: "TEXT" | "IMAGE" | "VIDEO" | "AUDIO" | "FILE" = "TEXT";

      if (file) {
        const formData = new FormData();
        formData.append("folder", "community-media");
        formData.append("communityId", communityId);
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
          setError(uploadData.error ?? "Upload failed.");
          setSending(false);
          return;
        }
        attachments = [
          {
            path: uploadData.path,
            mime: uploadData.mime,
            size: uploadData.size,
            name: uploadData.name,
          },
        ];
        type = file.type.startsWith("image/")
          ? "IMAGE"
          : file.type.startsWith("video/")
            ? "VIDEO"
            : file.type.startsWith("audio/")
              ? "AUDIO"
              : "FILE";
      }

      const response = await fetch(`/api/admin/communities/${communityId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          body: body.trim() || file?.name || "",
          attachments,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Unable to post update.");
        setSending(false);
        return;
      }
      setBody("");
      setFile(null);
      setMessages((current) => [...current, data.message]);
    } catch {
      setError("Unable to post update.");
    } finally {
      setSending(false);
    }
  }

  async function removeMessage(messageId: string) {
    await fetch(`/api/admin/communities/${communityId}/messages`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messageId, action: "delete" }),
    });
    setMessages((current) => current.filter((item) => item.id !== messageId));
  }

  return (
    <div className="rounded-3xl border border-primary/20 bg-white p-6 shadow-[0_8px_30px_rgba(16,185,129,0.08)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-primary">Admin posting</p>
          <h2 className="mt-1 font-headline-md text-on-background">Post newsletter messages here</h2>
          <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
            Only admins can post. Paying members open{" "}
            <strong>/community/{communitySlug}</strong> and <strong>read only</strong> — they cannot
            reply or send. Use this box whenever you want to publish an update to{" "}
            <strong>{communityName}</strong>.
          </p>
        </div>
        <a
          href={`/community/${communitySlug}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-xl border border-outline-variant/40 px-4 py-2 text-sm font-medium text-primary"
        >
          Preview as member
        </a>
      </div>

      <div
        ref={listRef}
        className="mt-5 max-h-[420px] space-y-3 overflow-y-auto rounded-2xl bg-surface-container-low p-4"
      >
        {hasMore && (
          <button
            type="button"
            className="w-full rounded-xl border border-outline-variant/40 px-3 py-2 text-sm font-medium text-primary"
            onClick={() => void loadOlder()}
            disabled={loadingOlder}
          >
            {loadingOlder ? "Loading…" : "Load earlier messages"}
          </button>
        )}
        {messages.map((message) => (
          <article key={message.id} className="rounded-2xl bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-primary">
                  {message.author.name ?? "Admin"} ·{" "}
                  {new Date(message.createdAt).toLocaleString()}
                </p>
                {message.attachments?.map((attachment) => (
                  <div key={attachment.path} className="mt-2">
                    {attachment.mime.startsWith("image/") ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={attachment.path}
                        alt={attachment.name}
                        className="max-h-48 rounded-xl object-contain"
                      />
                    ) : (
                      <a href={attachment.path} target="_blank" rel="noreferrer" className="text-sm text-primary">
                        {attachment.name}
                      </a>
                    )}
                  </div>
                ))}
                {message.body && <p className="mt-1 text-sm text-on-background">{message.body}</p>}
              </div>
              <button
                type="button"
                className="shrink-0 text-xs font-medium text-error"
                onClick={() => void removeMessage(message.id)}
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {messages.length === 0 && (
          <p className="text-sm text-on-surface-variant">
            No updates yet. Type below and click <strong>Post update</strong> — members will see it
            in their community feed.
          </p>
        )}
      </div>

      <form onSubmit={(e) => void sendUpdate(e)} className="mt-4 space-y-3">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          placeholder="Write the update members should read…"
          className="w-full rounded-xl border border-outline-variant/50 bg-surface-container-lowest px-4 py-3"
        />
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="file"
            accept="image/*,video/*,.pdf"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="max-w-full text-sm"
          />
          {file && (
            <button type="button" className="text-sm text-on-surface-variant" onClick={() => setFile(null)}>
              Clear file
            </button>
          )}
          <Button type="submit" disabled={sending || (!body.trim() && !file)} className="ml-auto">
            {sending ? "Posting…" : "Post update"}
          </Button>
        </div>
      </form>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
    </div>
  );
}
