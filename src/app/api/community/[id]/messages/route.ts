import { CommunityMessageType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  assertCanSend,
  assertCommunityMember,
  CommunityAccessError,
} from "@/lib/community-access";
import {
  getPinnedMessages,
  listCommunityMessages,
} from "@/lib/community-repositories";
import { prisma } from "@/lib/prisma";

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await assertCommunityMember(session.user.id, id);

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
  } catch (error) {
    if (error instanceof CommunityAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to load messages." }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const member = await assertCommunityMember(session.user.id, id);
    const input = sendSchema.parse(await request.json());

    const hasMedia = (input.attachments?.length ?? 0) > 0;
    const kind =
      input.type === "AUDIO" ? "voice" : hasMedia || input.type !== "TEXT" ? "media" : "text";
    assertCanSend(member, kind);

    if (!input.body?.trim() && !hasMedia) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    const message = await prisma.communityMessage.create({
      data: {
        communityId: id,
        authorId: session.user.id,
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

    await prisma.communityMember.update({
      where: { id: member.id },
      data: { lastReadAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    if (error instanceof CommunityAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid message." }, { status: 400 });
    }
    console.error("Send community message failed:", error);
    return NextResponse.json({ error: "Unable to send message." }, { status: 500 });
  }
}
