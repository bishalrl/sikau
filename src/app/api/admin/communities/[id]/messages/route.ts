import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const moderateSchema = z.object({
  messageId: z.string(),
  action: z.enum(["delete", "pin", "unpin"]),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 100);

  const messages = await prisma.communityMessage.findMany({
    where: { communityId: id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      attachments: true,
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ messages });
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
