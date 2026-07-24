import { ContentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ebookSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  titleNe: z.string().optional(),
  description: z.string().min(1),
  content: z.string().optional().default(""),
  coverImage: z.string().optional().or(z.literal("")),
  filePath: z.string().optional().or(z.literal("")),
  priceNpr: z.coerce.number().min(0).default(0),
  isFree: z.boolean().default(true),
  paymentQrPath: z.string().optional().or(z.literal("")),
  paymentInstructions: z.string().optional(),
  status: z.nativeEnum(ContentStatus).default(ContentStatus.DRAFT),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const input = ebookSchema.parse(await request.json());
    const isFree = input.isFree || input.priceNpr <= 0;

    const ebook = await prisma.ebook.upsert({
      where: { slug: input.slug },
      update: {
        title: input.title,
        titleNe: input.titleNe,
        description: input.description,
        content: input.content ?? "",
        coverImage: input.coverImage || null,
        filePath: input.filePath || null,
        priceNpr: isFree ? 0 : input.priceNpr,
        isFree,
        paymentQrPath: input.paymentQrPath || null,
        paymentInstructions: input.paymentInstructions,
        status: input.status,
        publishedAt: input.status === ContentStatus.PUBLISHED ? new Date() : null,
      },
      create: {
        slug: input.slug,
        title: input.title,
        titleNe: input.titleNe,
        description: input.description,
        content: input.content ?? "",
        coverImage: input.coverImage || null,
        filePath: input.filePath || null,
        priceNpr: isFree ? 0 : input.priceNpr,
        isFree,
        paymentQrPath: input.paymentQrPath || null,
        paymentInstructions: input.paymentInstructions,
        status: input.status,
        publishedAt: input.status === ContentStatus.PUBLISHED ? new Date() : null,
        authorId: session.user.id,
      },
    });

    return NextResponse.json({ ebook });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    return NextResponse.json({ error: "Unable to save ebook." }, { status: 500 });
  }
}
