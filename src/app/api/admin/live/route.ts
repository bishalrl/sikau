import { LiveSessionStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { canAdminStartLive } from "@/lib/live-access";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  scheduledAt: z.string().min(1),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sessions = await prisma.liveSession.findMany({
    include: { host: { select: { id: true, name: true, email: true } } },
    orderBy: { scheduledAt: "desc" },
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = createSchema.parse(await request.json());
    const scheduledAt = new Date(body.scheduledAt);

    if (Number.isNaN(scheduledAt.getTime())) {
      return NextResponse.json({ error: "Invalid scheduled time." }, { status: 400 });
    }

    const liveSession = await prisma.liveSession.create({
      data: {
        title: body.title,
        description: body.description || null,
        scheduledAt,
        hostId: session.user.id,
        status: LiveSessionStatus.SCHEDULED,
      },
    });

    return NextResponse.json({ session: liveSession }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    console.error("Create live session failed:", error);
    return NextResponse.json({ error: "Unable to create live session." }, { status: 500 });
  }
}

const actionSchema = z.object({
  sessionId: z.string().min(1),
  action: z.enum(["start", "end", "cancel"]),
});

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = actionSchema.parse(await request.json());
    const liveSession = await prisma.liveSession.findUnique({ where: { id: body.sessionId } });

    if (!liveSession) {
      return NextResponse.json({ error: "Live session not found." }, { status: 404 });
    }

    if (body.action === "start") {
      if (!canAdminStartLive(liveSession.scheduledAt, liveSession.status)) {
        return NextResponse.json(
          { error: "You can start this live only at or after the scheduled time." },
          { status: 400 },
        );
      }

      const updated = await prisma.liveSession.update({
        where: { id: liveSession.id },
        data: {
          status: LiveSessionStatus.LIVE,
          startedAt: new Date(),
          // Bind signaling to whoever actually opens the host room.
          hostId: session.user.id,
        },
      });

      return NextResponse.json({ session: updated });
    }

    if (body.action === "end") {
      if (liveSession.status !== LiveSessionStatus.LIVE) {
        return NextResponse.json({ error: "Only a live session can be ended." }, { status: 400 });
      }

      const updated = await prisma.liveSession.update({
        where: { id: liveSession.id },
        data: {
          status: LiveSessionStatus.ENDED,
          endedAt: new Date(),
        },
      });

      return NextResponse.json({ session: updated });
    }

    const updated = await prisma.liveSession.update({
      where: { id: liveSession.id },
      data: {
        status: LiveSessionStatus.CANCELLED,
        endedAt: new Date(),
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid request." }, { status: 400 });
    }
    console.error("Update live session failed:", error);
    return NextResponse.json({ error: "Unable to update live session." }, { status: 500 });
  }
}
