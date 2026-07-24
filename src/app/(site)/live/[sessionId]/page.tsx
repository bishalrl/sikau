import { redirect } from "next/navigation";
import { LiveRoom } from "@/components/live/LiveRoom";
import { canJoinLiveByTime, userHasLearnerAccess } from "@/lib/live-access";
import { getLiveSessionById } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

type Props = { params: Promise<{ sessionId: string }> };

export default async function LiveViewerPage({ params }: Props) {
  const session = await getCurrentSession();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const { sessionId } = await params;
  const live = await getLiveSessionById(sessionId);
  if (!live) {
    redirect("/dashboard");
  }

  const hasAccess = await userHasLearnerAccess(session.user.id, session.user.role);
  if (!hasAccess) {
    redirect("/dashboard");
  }

  if (!canJoinLiveByTime(live.scheduledAt) || live.status !== "LIVE") {
    redirect("/dashboard");
  }

  return (
    <div className="site-container py-lg">
      <LiveRoom
        sessionId={live.id}
        title={live.title}
        hostId={live.hostId}
        role="viewer"
        userId={session.user.id}
      />
    </div>
  );
}
