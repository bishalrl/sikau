"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type LiveItem = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string | Date;
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  host?: { name: string | null };
};

type Props = {
  sessions: LiveItem[];
};

function formatWhen(value: string | Date) {
  return new Date(value).toLocaleString();
}

export function DashboardLiveSection({ sessions: initial }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (initial.length === 0) {
    return (
      <div className="rounded-2xl bg-surface-container-low p-5">
        <p className="text-sm text-on-surface-variant">No upcoming live sessions yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {initial.map((session) => {
        const scheduledAt = new Date(session.scheduledAt).getTime();
        const timeReached = now >= scheduledAt;
        const joinEnabled = timeReached && session.status === "LIVE";
        const waitingForHost = timeReached && session.status === "SCHEDULED";

        return (
          <article key={session.id} className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                  {session.status === "LIVE" ? "Live now" : "Scheduled"}
                </p>
                <h3 className="mt-1 font-label-md text-on-background">{session.title}</h3>
                {session.description && (
                  <p className="mt-1 text-sm text-on-surface-variant">{session.description}</p>
                )}
                <p className="mt-2 text-sm text-on-surface-variant">
                  Starts {formatWhen(session.scheduledAt)}
                  {session.host?.name ? ` · Hosted by ${session.host.name}` : ""}
                </p>
                {!timeReached && (
                  <p className="mt-1 text-sm font-medium text-primary">
                    Join unlocks at the scheduled time.
                  </p>
                )}
                {waitingForHost && (
                  <p className="mt-1 text-sm font-medium text-tertiary">
                    Time reached — waiting for admin to start the live.
                  </p>
                )}
              </div>
              {joinEnabled ? (
                <Button href={`/live/${session.id}`}>Join live</Button>
              ) : (
                <Button disabled variant="outline">
                  {timeReached ? "Waiting for host" : "Join locked"}
                </Button>
              )}
            </div>
          </article>
        );
      })}
      <Link href="/ebooks" className="inline-block text-sm font-medium text-primary">
        Browse ebooks
      </Link>
    </div>
  );
}
