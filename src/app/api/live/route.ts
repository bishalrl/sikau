import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canJoinLiveByTime, userHasLearnerAccess } from "@/lib/live-access";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const hasAccess = await userHasLearnerAccess(session.user.id, session.user.role);
  if (!hasAccess) {
    return NextResponse.json({ error: "Enroll in a course or unlock an ebook first." }, { status: 403 });
  }

  const sessions = await prisma.liveSession.findMany({
    where: { status: { in: ["SCHEDULED", "LIVE"] } },
    include: { host: { select: { id: true, name: true } } },
    orderBy: [{ status: "asc" }, { scheduledAt: "asc" }],
  });

  const now = Date.now();
  return NextResponse.json({
    sessions: sessions.map((item) => ({
      ...item,
      joinEnabled: canJoinLiveByTime(item.scheduledAt) && item.status === "LIVE",
      timeReached: now >= item.scheduledAt.getTime(),
    })),
  });
}
