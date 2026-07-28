import { CommunityMemberRole, CommunityMessageType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getPinnedMessages, listCommunityMessages } from "@/lib/community-repositories";
import { prisma } from "@/lib/prisma";

const moderateSchema = z.object({
  messageId: z.string(),
  action: z.enum(["delete", "pin", "unpin"]),
});

const sendSchema = z.object({
  body: z.string().trim().max(8000).optional(),
  type: z.enum(["TEXT", "IMAGE", "VIDEO", "AUDIO", "FILE"]).default("TEXT"),
  replyToId: z.string().optional().nullable(),
  attachments: z
    .array(
      z.object({
        path: z.string(),
        mime: z.string(),
        size: z.number().int().nonnegative(),
        name: z.string(),
        durationMs: z.number().int().optional().nullable(),
        thumbPath: z.string().optional().nullable(),
      }),
    )
    .optional()
    .default([]),
});

async function requireAdminId() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") return null;
  if (session.user.id) return session.user.id;
  if (session.user.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { id: true },
    });
    return user?.id ?? null;
  }
  return null;
}

async function ensureAdminMember(communityId: string, userId: string) {
  await prisma.communityMember.upsert({
    where: {
      communityId_userId: { communityId, userId },
    },
    update: {
      role: CommunityMemberRole.ADMIN,
      bannedAt: null,
      mutedUntil: null,
    },
    create: {
      communityId,
      userId,
      role: CommunityMemberRole.ADMIN,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await requireAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const before = url.searchParams.get("before") ?? undefined;
  const after = url.searchParams.get("after") ?? undefined;
  const search = url.searchParams.get("q") ?? undefined;
  const limit = Number(url.searchParams.get("limit") ?? 40);
  const pinned = url.searchParams.get("pinned") === "1";

  if (pinned) {
    const messages = await getPinnedMessages(id);
    return NextResponse.json({ messages });
  }

  const messages = await listCommunityMessages({
    communityId: id,
    before,
    after,
    search,
    limit,
  });

  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await requireAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const community = await prisma.community.findUnique({ where: { id } });
    if (!community) {
      return NextResponse.json({ error: "Community not found." }, { status: 404 });
    }

    await ensureAdminMember(id, adminId);
    const input = sendSchema.parse(await request.json());
    const hasMedia = (input.attachments?.length ?? 0) > 0;

    if (!input.body?.trim() && !hasMedia) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    const message = await prisma.communityMessage.create({
      data: {
        communityId: id,
        authorId: adminId,
        type: input.type as CommunityMessageType,
        body: input.body?.trim() ?? "",
        replyToId: input.replyToId || null,
        attachments: hasMedia
          ? {
              create: input.attachments!.map((file) => ({
                path: file.path,
                mime: file.mime,
                size: file.size,
                name: file.name,
                durationMs: file.durationMs ?? null,
                thumbPath: file.thumbPath ?? null,
              })),
            }
          : undefined,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        attachments: true,
        reactions: { select: { id: true, emoji: true, userId: true } },
        replyTo: {
          select: {
            id: true,
            body: true,
            type: true,
            author: { select: { id: true, name: true } },
            deletedAt: true,
          },
        },
      },
    });

    await prisma.community.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid message." }, { status: 400 });
    }
    console.error("Admin send community message failed:", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const adminId = await requireAdminId();
  if (!adminId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const input = moderateSchema.parse(await request.json());

    if (input.action === "delete") {
      const message = await prisma.communityMessage.update({
        where: { id: input.messageId, communityId: id },
        data: { deletedAt: new Date(), body: "" },
      });
      return NextResponse.json({ message });
    }

    const message = await prisma.communityMessage.update({
      where: { id: input.messageId, communityId: id },
      data: {
        pinnedAt: input.action === "pin" ? new Date() : null,
      },
    });
    return NextResponse.json({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to moderate message." }, { status: 500 });
  }
}
