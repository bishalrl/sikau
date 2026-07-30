"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MaterialIcon } from "@/components/landing/MaterialIcon";
import { Button } from "@/components/ui/Button";

export type HomeLiveSession = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string | Date;
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  host?: { name: string | null } | null;
};

type Props = {
  sessions: HomeLiveSession[];
  isLoggedIn: boolean;
};

function formatWhen(value: string | Date) {
  return new Date(value).toLocaleString("en-NP", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function HomepageLiveSessions({ sessions, isLoggedIn }: Props) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (sessions.length === 0) {
    return null;
  }

  return (
    <section className="home-live py-xl" id="live">
      <div className="site-container">
        <div className="mb-lg max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Live sessions</p>
          <h2 className="mt-2 font-display-md text-display-md text-on-background">Join a live session</h2>
          <p className="mt-sm text-on-surface-variant">
            Upcoming sessions scheduled by the admin. Join opens at the listed date and time once the host goes live.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {sessions.map((session) => {
            const scheduledAt = new Date(session.scheduledAt).getTime();
            const timeReached = now >= scheduledAt;
            const isLive = session.status === "LIVE";
            const joinEnabled = timeReached && isLive;
            const waitingForHost = timeReached && session.status === "SCHEDULED";

            return (
              <article
                key={session.id}
                className={`rounded-3xl border p-6 shadow-sm ${
                  isLive
                    ? "border-primary/40 bg-primary/5"
                    : "border-outline-variant/30 bg-surface-container-lowest"
                }`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                      isLive ? "bg-primary text-white" : "bg-surface-container text-primary"
                    }`}
                  >
                    {isLive ? "Live now" : "Upcoming"}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-on-surface-variant">
                    <MaterialIcon name="schedule" className="text-[16px]" />
                    {formatWhen(session.scheduledAt)}
                  </span>
                </div>

                <h3 className="mt-3 font-headline-md text-on-background">{session.title}</h3>
                {session.description && (
                  <p className="mt-2 text-sm text-on-surface-variant">{session.description}</p>
                )}
                {session.host?.name && (
                  <p className="mt-2 text-sm text-on-surface-variant">Hosted by {session.host.name}</p>
                )}

                {!timeReached && (
                  <p className="mt-3 text-sm font-medium text-primary">
                    Join unlocks at the scheduled time.
                  </p>
                )}
                {waitingForHost && (
                  <p className="mt-3 text-sm font-medium text-tertiary">
                    Time reached — waiting for the host to start.
                  </p>
                )}

                <div className="mt-5">
                  {!isLoggedIn ? (
                    <Button
                      href={`/login?callbackUrl=${encodeURIComponent(`/live/${session.id}`)}`}
                      className="w-full sm:w-auto"
                    >
                      Login to join
                    </Button>
                  ) : joinEnabled ? (
                    <Button href={`/live/${session.id}`} className="w-full sm:w-auto">
                      Join live session
                    </Button>
                  ) : (
                    <Button disabled variant="outline" className="w-full sm:w-auto">
                      {waitingForHost ? "Waiting for host" : "Join locked"}
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {!isLoggedIn && (
          <p className="mt-6 text-sm text-on-surface-variant">
            Already enrolled?{" "}
            <Link href="/login" className="font-semibold text-primary">
              Sign in
            </Link>{" "}
            to join when the session goes live.
          </p>
        )}
      </div>
    </section>
  );
}
