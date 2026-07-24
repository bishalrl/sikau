"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

type LiveItem = {
  id: string;
  title: string;
  description: string | null;
  scheduledAt: string;
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  host?: { name: string | null; email: string };
};

type Props = {
  sessions: LiveItem[];
};

function toLocalInputValue(date = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function LiveManager({ sessions: initial }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initial);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState(toLocalInputValue(new Date(Date.now() + 60 * 60 * 1000)));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createSession(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const response = await fetch("/api/admin/live", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        scheduledAt: new Date(scheduledAt).toISOString(),
      }),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.error ?? "Unable to create session.");
      return;
    }

    setTitle("");
    setDescription("");
    setMessage("Live session scheduled.");
    router.refresh();
    setSessions((prev) => [data.session, ...prev]);
  }

  async function runAction(sessionId: string, action: "start" | "end" | "cancel") {
    setMessage("");
    const response = await fetch("/api/admin/live", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, action }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error ?? "Action failed.");
      return;
    }

    setSessions((prev) => prev.map((item) => (item.id === sessionId ? { ...item, ...data.session } : item)));
    router.refresh();

    if (action === "start") {
      router.push(`/live/${sessionId}/host`);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={createSession} className="space-y-4 rounded-3xl border border-outline-variant/30 bg-white p-6">
        <h2 className="font-headline-md text-on-background">Schedule a live session</h2>
        <p className="text-sm text-on-surface-variant">
          Set the start time first. Users will see it on their dashboard; Join unlocks at that time after you start.
        </p>
        <div>
          <label className="mb-1 block text-sm font-medium">Title</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/50 px-4 py-3"
            placeholder="Monthly NEPSE live Q&A"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/50 px-4 py-3"
            rows={3}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Scheduled start</label>
          <input
            required
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full rounded-xl border border-outline-variant/50 px-4 py-3"
          />
        </div>
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create live session"}
        </Button>
        {message && <p className="text-sm text-on-surface-variant">{message}</p>}
      </form>

      <div className="space-y-4">
        <h2 className="font-headline-md text-on-background">All sessions</h2>
        {sessions.length === 0 && <p className="text-sm text-on-surface-variant">No live sessions yet.</p>}
        {sessions.map((item) => {
          const scheduled = new Date(item.scheduledAt);
          const timeReached = Date.now() >= scheduled.getTime();
          return (
            <article key={item.id} className="rounded-2xl border border-outline-variant/30 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{item.status}</p>
                  <h3 className="mt-1 font-headline-md text-on-background">{item.title}</h3>
                  {item.description && <p className="mt-1 text-sm text-on-surface-variant">{item.description}</p>}
                  <p className="mt-2 text-sm text-on-surface-variant">
                    Starts: {scheduled.toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.status === "SCHEDULED" && (
                    <Button
                      type="button"
                      size="sm"
                      disabled={!timeReached}
                      onClick={() => runAction(item.id, "start")}
                    >
                      {timeReached ? "Start live" : "Waiting for schedule"}
                    </Button>
                  )}
                  {item.status === "LIVE" && (
                    <>
                      <Button type="button" size="sm" href={`/live/${item.id}/host`}>
                        Open host room
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => runAction(item.id, "end")}>
                        End
                      </Button>
                    </>
                  )}
                  {item.status === "SCHEDULED" && (
                    <Button type="button" size="sm" variant="outline" onClick={() => runAction(item.id, "cancel")}>
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
