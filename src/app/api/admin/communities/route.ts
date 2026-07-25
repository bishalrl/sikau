import { CommunityMemberRole, CommunityStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getManageableCommunities } from "@/lib/community-repositories";
import { prisma } from "@/lib/prisma";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const communitySchema = z.object({
  slug: z
    .string()
    .trim()
    .transform((value) => slugify(value))
    .pipe(z.string().min(2, "Slug is required.").max(80).regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers, and dashes.")),
  name: z.string().trim().min(2, "Name is required.").max(120),
  description: z.string().trim().max(2000).optional().default(""),
  coverImage: z.string().optional().nullable().or(z.literal("")),
  status: z.enum(["ACTIVE", "ARCHIVED"]).optional().default("ACTIVE"),
  permissions: z
    .object({
      text: z.enum(["ALL", "MODS", "ADMIN"]),
      media: z.enum(["ALL", "MODS", "ADMIN"]),
      voice: z.enum(["ALL", "MODS", "ADMIN"]),
    })
    .optional()
    .default({ text: "ALL", media: "ALL", voice: "MODS" }),
  ebookIds: z.array(z.string()).optional().default([]),
});

async function requireAdminUserId() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return null;
  }

  if (session.user.id) {
    return { session, userId: session.user.id };
  }

  if (session.user.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { id: true },
    });
    if (user) {
      return { session, userId: user.id };
    }
  }

  return null;
}

export async function GET() {
  const auth = await requireAdminUserId();
  if (!auth) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const communities = await getManageableCommunities();
  return NextResponse.json({ communities });
}

export async function POST(request: Request) {
  const auth = await requireAdminUserId();
  if (!auth) {
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
        permissions: JSON.stringify(input.permissions),
        ebookLinks: {
          create: (input.ebookIds ?? []).map((ebookId) => ({ ebookId })),
        },
        members: {
          create: {
            userId: auth.userId,
            role: CommunityMemberRole.ADMIN,
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

    const prismaCode =
      error && typeof error === "object" && "code" in error
        ? String((error as { code?: string }).code)
        : "";

    if (prismaCode === "P2002") {
      return NextResponse.json(
        { error: "A community with this slug already exists. Choose a different slug." },
        { status: 409 },
      );
    }

    console.error("Create community failed:", error);
    return NextResponse.json({ error: "Unable to create community." }, { status: 500 });
  }
}
