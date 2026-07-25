import { CommunityStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  name: z.string().trim().min(2).max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  coverImage: z.string().optional().nullable(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional(),
  permissions: z
    .object({
      text: z.enum(["ALL", "MODS", "ADMIN"]),
      media: z.enum(["ALL", "MODS", "ADMIN"]),
      voice: z.enum(["ALL", "MODS", "ADMIN"]),
    })
    .optional(),
  ebookIds: z.array(z.string()).optional(),
});

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
    const input = updateSchema.parse(await request.json());

    if (input.ebookIds) {
      await prisma.communityEbookLink.deleteMany({ where: { communityId: id } });
      if (input.ebookIds.length) {
        await prisma.communityEbookLink.createMany({
          data: input.ebookIds.map((ebookId) => ({ communityId: id, ebookId })),
          skipDuplicates: true,
        });
      }
    }

    const community = await prisma.community.update({
      where: { id },
      data: {
        ...(input.slug ? { slug: input.slug } : {}),
        ...(input.name ? { name: input.name } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.coverImage !== undefined ? { coverImage: input.coverImage || null } : {}),
        ...(input.status
          ? {
              status:
                input.status === "ARCHIVED" ? CommunityStatus.ARCHIVED : CommunityStatus.ACTIVE,
            }
          : {}),
        ...(input.permissions ? { permissions: JSON.stringify(input.permissions) } : {}),
      },
      include: {
        ebookLinks: { include: { ebook: { select: { id: true, slug: true, title: true } } } },
        _count: { select: { members: true, messages: true } },
      },
    });

    return NextResponse.json({ community });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to update community." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    await prisma.community.update({
      where: { id },
      data: { status: CommunityStatus.ARCHIVED },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unable to archive community." }, { status: 500 });
  }
}
