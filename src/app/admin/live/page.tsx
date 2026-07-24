import { LiveManager } from "@/components/admin/LiveManager";
import { getManageableLiveSessions } from "@/lib/repositories";

export default async function AdminLivePage() {
  const sessions = await getManageableLiveSessions();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Live</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Schedule & start live sessions</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Create a session ahead of time. Start is allowed only at or after the scheduled time. Learners can join once
          you go live.
        </p>
      </div>
      <LiveManager
        sessions={sessions.map((session) => ({
          ...session,
          scheduledAt: session.scheduledAt.toISOString(),
        }))}
      />
    </section>
  );
}
