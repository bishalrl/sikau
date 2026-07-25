import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import {
  assertCanModerate,
  assertCommunityMember,
  CommunityAccessError,
} from "@/lib/community-access";
import { prisma } from "@/lib/prisma";

const actionSchema = z.object({
  messageId: z.string(),
  action: z.enum(["react", "unreact", "pin", "unpin", "delete"]),
  emoji: z.string().min(1).max(16).optional(),
});

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
    const input = actionSchema.parse(await request.json());

    const message = await prisma.communityMessage.findFirst({
      where: { id: input.messageId, communityId: id },
    });
    if (!message || message.deletedAt) {
      return NextResponse.json({ error: "Message not found." }, { status: 404 });
    }

    if (input.action === "react") {
      const emoji = input.emoji ?? "👍";
      await prisma.communityReaction.upsert({
        where: {
          messageId_userId_emoji: {
            messageId: message.id,
            userId: session.user.id,
            emoji,
          },
        },
        update: {},
        create: {
          messageId: message.id,
          userId: session.user.id,
          emoji,
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (input.action === "unreact") {
      await prisma.communityReaction.deleteMany({
        where: {
          messageId: message.id,
          userId: session.user.id,
          ...(input.emoji ? { emoji: input.emoji } : {}),
        },
      });
      return NextResponse.json({ ok: true });
    }

    const isAuthor = message.authorId === session.user.id;
    if (input.action === "delete") {
      if (!isAuthor) assertCanModerate(member);
      await prisma.communityMessage.update({
        where: { id: message.id },
        data: { deletedAt: new Date(), body: "" },
      });
      return NextResponse.json({ ok: true });
    }

    assertCanModerate(member);
    await prisma.communityMessage.update({
      where: { id: message.id },
      data: { pinnedAt: input.action === "pin" ? new Date() : null },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CommunityAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid action." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update message." }, { status: 500 });
  }
}
