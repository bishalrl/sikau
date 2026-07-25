"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type CommunityListItem = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImage: string | null;
  unreadCount: number;
  lastMessage: {
    body: string;
    type: string;
    createdAt: string;
    authorName: string;
  } | null;
};

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function CommunityList() {
  const [communities, setCommunities] = useState<CommunityListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch("/api/community");
      const data = await response.json();
      if (cancelled) return;
      setLoading(false);
      if (!response.ok) {
        setError(data.error ?? "Unable to load communities.");
        return;
      }
      setCommunities(data.communities);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <p className="text-sm text-on-surface-variant">Loading communities…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (communities.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-outline-variant/50 bg-white p-8 text-center">
        <h2 className="font-headline-md text-on-background">No communities yet</h2>
        <p className="mt-2 text-sm text-on-surface-variant">
          Community chat unlocks automatically after your Community package payment is approved.
        </p>
        <Link
          href="/ebooks#packages"
          className="mt-5 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white"
        >
          View Community package
        </Link>
      </div>
    );
  }

  return (
    <div className="community-list">
      {communities.map((community) => (
        <Link key={community.id} href={`/community/${community.slug}`} className="community-list__item">
          <div className="community-list__avatar">
            {community.coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={community.coverImage} alt="" />
            ) : (
              <span>{community.name.slice(0, 1)}</span>
            )}
          </div>
          <div className="community-list__body">
            <div className="community-list__row">
              <p className="community-list__name">{community.name}</p>
              <span className="community-list__time">{formatTime(community.lastMessage?.createdAt)}</span>
            </div>
            <div className="community-list__row">
              <p className="community-list__preview">
                {community.lastMessage
                  ? `${community.lastMessage.authorName}: ${
                      community.lastMessage.body || `[${community.lastMessage.type}]`
                    }`
                  : "No messages yet — say hello!"}
              </p>
              {community.unreadCount > 0 && (
                <span className="community-list__badge">{community.unreadCount}</span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
