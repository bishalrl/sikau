import { ContentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const blogSchema = z.object({
  id: z.string().optional(),
  slug: z.string().min(1),
  title: z.string().min(1),
  titleNe: z.string().optional(),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  coverImage: z.string().optional().or(z.literal("")),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const input = blogSchema.parse(await request.json());
    const publishedAt =
      input.status === ContentStatus.PUBLISHED
        ? new Date()
        : null;

    const post = await prisma.blogPost.upsert({
      where: { slug: input.slug },
      update: {
        title: input.title,
        titleNe: input.titleNe,
        excerpt: input.excerpt,
        content: input.content,
        coverImage: input.coverImage || null,
        status: input.status,
        publishedAt,
      },
      create: {
        slug: input.slug,
        title: input.title,
        titleNe: input.titleNe,
        excerpt: input.excerpt,
        content: input.content,
        coverImage: input.coverImage || null,
        status: input.status,
        publishedAt,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ post });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to save blog post." }, { status: 500 });
  }
}
