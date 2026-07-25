import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assertCommunityMember, CommunityAccessError } from "@/lib/community-access";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const member = await assertCommunityMember(session.user.id, id);
    await prisma.communityMember.update({
      where: { id: member.id },
      data: { lastReadAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof CommunityAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "Unable to mark as read." }, { status: 500 });
  }
}
