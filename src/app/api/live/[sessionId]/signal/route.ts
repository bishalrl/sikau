import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { canJoinLiveByTime, userHasLearnerAccess } from "@/lib/live-access";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ sessionId: string }> };

async function assertLiveAccess(sessionId: string, userId: string, role?: string | null) {
  const liveSession = await prisma.liveSession.findUnique({ where: { id: sessionId } });
  if (!liveSession) {
    return { error: NextResponse.json({ error: "Live session not found." }, { status: 404 }) };
  }

  const isHost = liveSession.hostId === userId || role === "ADMIN";
  if (!isHost) {
    const hasAccess = await userHasLearnerAccess(userId, role);
    if (!hasAccess) {
      return { error: NextResponse.json({ error: "Access denied." }, { status: 403 }) };
    }
    if (!canJoinLiveByTime(liveSession.scheduledAt)) {
      return { error: NextResponse.json({ error: "Live has not started yet." }, { status: 403 }) };
    }
    if (liveSession.status !== "LIVE") {
      return { error: NextResponse.json({ error: "Host has not started the live session." }, { status: 403 }) };
    }
  }

  return { liveSession, isHost };
}

export async function GET(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const access = await assertLiveAccess(sessionId, session.user.id, session.user.role);
  if ("error" in access && access.error) {
    return access.error;
  }

  const url = new URL(request.url);
  const after = url.searchParams.get("after");
  const afterDate = after ? new Date(after) : new Date(0);

  const signals = await prisma.liveSignal.findMany({
    where: {
      sessionId,
      createdAt: { gt: afterDate },
      OR: [{ toUserId: session.user.id }, { toUserId: null, fromUserId: { not: session.user.id } }],
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  return NextResponse.json({
    session: access.liveSession,
    signals,
    serverTime: new Date().toISOString(),
  });
}

const signalSchema = z.object({
  type: z.enum(["viewer-join", "viewer-leave", "offer", "answer", "ice"]),
  toUserId: z.string().optional().nullable(),
  payload: z.record(z.string(), z.any()).default({}),
});

export async function POST(request: Request, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const access = await assertLiveAccess(sessionId, session.user.id, session.user.role);
  if ("error" in access && access.error) {
    return access.error;
  }

  try {
    const body = signalSchema.parse(await request.json());

    if (body.type === "viewer-join") {
      await prisma.liveSignal.create({
        data: {
          sessionId,
          fromUserId: session.user.id,
          toUserId: access.liveSession!.hostId,
          type: "viewer-join",
          payload: JSON.stringify({
            name: session.user.name ?? session.user.email,
            userId: session.user.id,
          }),
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (body.type === "viewer-leave") {
      await prisma.liveSignal.create({
        data: {
          sessionId,
          fromUserId: session.user.id,
          toUserId: access.liveSession!.hostId,
          type: "viewer-leave",
          payload: JSON.stringify({ userId: session.user.id }),
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (!body.toUserId) {
      return NextResponse.json({ error: "toUserId is required for WebRTC signals." }, { status: 400 });
    }

    await prisma.liveSignal.create({
      data: {
        sessionId,
        fromUserId: session.user.id,
        toUserId: body.toUserId,
        type: body.type,
        payload: JSON.stringify(body.payload),
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    console.error("Live signal failed:", error);
    return NextResponse.json({ error: "Unable to send signal." }, { status: 500 });
  }
}
