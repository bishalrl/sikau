import { CommunityMemberRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { listCommunityMembers } from "@/lib/community-repositories";
import { prisma } from "@/lib/prisma";

const memberPatchSchema = z.object({
  memberId: z.string(),
  action: z.enum(["role", "mute", "unmute", "ban", "unban", "remove"]),
  role: z.enum(["ADMIN", "MODERATOR", "MEMBER"]).optional(),
  muteHours: z.number().min(1).max(24 * 30).optional(),
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
  const members = await listCommunityMembers(id);
  return NextResponse.json({ members });
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
    const { id } = await params;
    const input = memberPatchSchema.parse(await request.json());

    if (input.action === "remove") {
      await prisma.communityMember.delete({ where: { id: input.memberId } });
      return NextResponse.json({ ok: true });
    }

    const data: {
      role?: CommunityMemberRole;
      mutedUntil?: Date | null;
      bannedAt?: Date | null;
    } = {};

    if (input.action === "role" && input.role) {
      data.role = input.role as CommunityMemberRole;
    }
    if (input.action === "mute") {
      const hours = input.muteHours ?? 24;
      data.mutedUntil = new Date(Date.now() + hours * 60 * 60 * 1000);
    }
    if (input.action === "unmute") {
      data.mutedUntil = null;
    }
    if (input.action === "ban") {
      data.bannedAt = new Date();
    }
    if (input.action === "unban") {
      data.bannedAt = null;
    }

    const member = await prisma.communityMember.update({
      where: { id: input.memberId, communityId: id },
      data,
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ member });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update member." }, { status: 500 });
  }
}
