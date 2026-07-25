import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const announcementSchema = z.object({
  title: z.string().trim().min(2).max(160),
  body: z.string().trim().min(1).max(4000),
  pinned: z.boolean().default(true),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const announcements = await prisma.communityAnnouncement.findMany({
    where: { communityId: id },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ announcements });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN" || !session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const input = announcementSchema.parse(await request.json());
    const announcement = await prisma.communityAnnouncement.create({
      data: {
        communityId: id,
        title: input.title,
        body: input.body,
        pinned: input.pinned,
        createdById: session.user.id,
      },
    });
    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to create announcement." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await params;
    const body = z
      .object({
        announcementId: z.string(),
        pinned: z.boolean().optional(),
        title: z.string().trim().min(2).max(160).optional(),
        body: z.string().trim().min(1).max(4000).optional(),
        delete: z.boolean().optional(),
      })
      .parse(await request.json());

    if (body.delete) {
      await prisma.communityAnnouncement.delete({ where: { id: body.announcementId } });
      return NextResponse.json({ ok: true });
    }

    const announcement = await prisma.communityAnnouncement.update({
      where: { id: body.announcementId },
      data: {
        ...(body.pinned !== undefined ? { pinned: body.pinned } : {}),
        ...(body.title ? { title: body.title } : {}),
        ...(body.body ? { body: body.body } : {}),
      },
    });
    return NextResponse.json({ announcement });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update announcement." }, { status: 500 });
  }
}
