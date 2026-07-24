import { redirect } from "next/navigation";
import { LiveRoom } from "@/components/live/LiveRoom";
import { getLiveSessionById } from "@/lib/repositories";
import { getCurrentSession } from "@/lib/session";

type Props = { params: Promise<{ sessionId: string }> };

export default async function LiveHostPage({ params }: Props) {
  const session = await getCurrentSession();
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login");
  }

  const { sessionId } = await params;
  const live = await getLiveSessionById(sessionId);
  if (!live || live.status !== "LIVE") {
    redirect("/admin/live");
  }

  return (
    <div className="site-container py-lg">
      <LiveRoom
        sessionId={live.id}
        title={live.title}
        hostId={live.hostId}
        role="host"
        userId={session.user.id}
      />
    </div>
  );
}
