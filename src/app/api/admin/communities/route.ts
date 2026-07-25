import { CommunityStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getManageableCommunities } from "@/lib/community-repositories";
import { prisma } from "@/lib/prisma";

const communitySchema = z.object({
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).optional(),
  coverImage: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
  permissions: z
    .object({
      text: z.enum(["ALL", "MODS", "ADMIN"]).default("ALL"),
      media: z.enum(["ALL", "MODS", "ADMIN"]).default("ALL"),
      voice: z.enum(["ALL", "MODS", "ADMIN"]).default("MODS"),
    })
    .optional(),
  ebookIds: z.array(z.string()).default([]),
});

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const communities = await getManageableCommunities();
  return NextResponse.json({ communities });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user.role !== "ADMIN" || !session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    if (!body.slug && body.name) {
      body.slug = slugify(String(body.name));
    }
    const input = communitySchema.parse(body);

    const community = await prisma.community.create({
      data: {
        slug: input.slug,
        name: input.name,
        description: input.description ?? "",
        coverImage: input.coverImage || null,
        status: input.status === "ARCHIVED" ? CommunityStatus.ARCHIVED : CommunityStatus.ACTIVE,
        permissions: JSON.stringify(
          input.permissions ?? { text: "ALL", media: "ALL", voice: "MODS" },
        ),
        ebookLinks: {
          create: input.ebookIds.map((ebookId) => ({ ebookId })),
        },
        members: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        ebookLinks: { include: { ebook: { select: { id: true, slug: true, title: true } } } },
        _count: { select: { members: true, messages: true } },
      },
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid payload." }, { status: 400 });
    }
    console.error("Create community failed:", error);
    return NextResponse.json({ error: "Unable to create community." }, { status: 500 });
  }
}
