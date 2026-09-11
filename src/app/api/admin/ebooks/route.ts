import { ContentStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { CANONICAL_NEPSE_EBOOK_SLUG as NEPSE_SLUG } from "@/lib/ebooks";
import { prisma } from "@/lib/prisma";

const accessTypeSchema = z.enum([
  "LIFETIME",
  "MONTHLY",
  "QUARTERLY",
  "SEMIANNUAL",
  "YEARLY",
]);

const ebookSchema = z
  .object({
    slug: z
      .string()
      .min(1)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase letters, numbers, and hyphens."),
    title: z.string().min(1),
    titleNe: z.string().optional(),
    headline: z.string().optional().or(z.literal("")),
    description: z.string().min(1),
    content: z.string().optional().default(""),
    curriculumJson: z.string().optional().default("[]"),
    audienceJson: z.string().optional().default("[]"),
    coverImage: z.string().optional().or(z.literal("")),
    filePath: z.string().optional().or(z.literal("")),
    priceNpr: z.coerce.number().min(0).default(0),
    listPriceNpr: z.coerce.number().min(0).optional().nullable(),
    promoEndsAt: z
      .string()
      .optional()
      .nullable()
      .transform((value) => {
        if (!value || !value.trim()) return null;
        const date = new Date(value);
        return Number.isNaN(date.getTime()) ? null : date;
      }),
    isFree: z.boolean().default(false),
    paymentQrPath: z.string().optional().or(z.literal("")),
    paymentInstructions: z.string().optional(),
    communityOfferEnabled: z.boolean().default(false),
    communityOfferName: z.string().optional().nullable(),
    communityOfferPriceNpr: z.coerce.number().min(0).optional().nullable(),
    communityAccessType: accessTypeSchema.optional().nullable(),
    communityBenefitsJson: z.string().optional().default("[]"),
    communityId: z.string().optional().nullable().or(z.literal("")),
    status: z.nativeEnum(ContentStatus).default(ContentStatus.PUBLISHED),
  })
  .superRefine((value, ctx) => {
    if (!value.communityOfferEnabled) return;
    if (!value.communityOfferName?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Community name is required when the community offer is enabled.",
        path: ["communityOfferName"],
      });
    }
    if (value.communityOfferPriceNpr == null || value.communityOfferPriceNpr <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Community price is required when the community offer is enabled.",
        path: ["communityOfferPriceNpr"],
      });
    }
    if (!value.communityId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a community when the community offer is enabled.",
        path: ["communityId"],
      });
    }
  });

function safeJsonArray(raw: string | undefined, fallback = "[]") {
  if (!raw?.trim()) return fallback;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? JSON.stringify(parsed) : fallback;
  } catch {
    return fallback;
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !["ADMIN", "INSTRUCTOR"].includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const input = ebookSchema.parse(await request.json());
    const isFree = input.isFree || input.priceNpr <= 0;
    const finalStatus =
      input.slug === NEPSE_SLUG ? ContentStatus.PUBLISHED : input.status;
    const communityOfferEnabled = input.communityOfferEnabled;
    const communityId =
      communityOfferEnabled && input.communityId ? input.communityId : null;

    if (communityId) {
      const community = await prisma.community.findUnique({
        where: { id: communityId },
        select: { id: true },
      });
      if (!community) {
        return NextResponse.json({ error: "Selected community was not found." }, { status: 400 });
      }
    }

    const data = {
      title: input.title,
      titleNe: input.titleNe || null,
      headline: input.headline?.trim() || null,
      description: input.description,
      content: input.content ?? "",
      curriculumJson: safeJsonArray(input.curriculumJson),
      audienceJson: safeJsonArray(input.audienceJson),
      coverImage: input.coverImage || null,
      filePath: input.filePath || null,
      priceNpr: isFree ? 0 : input.priceNpr,
      listPriceNpr: isFree ? null : input.listPriceNpr ?? null,
      promoEndsAt: isFree ? null : input.promoEndsAt ?? null,
      isFree,
      paymentQrPath: input.paymentQrPath || null,
      paymentInstructions: input.paymentInstructions || null,
      communityOfferEnabled,
      communityOfferName: communityOfferEnabled
        ? input.communityOfferName?.trim() || null
        : null,
      communityOfferPriceNpr: communityOfferEnabled
        ? input.communityOfferPriceNpr ?? null
        : null,
      communityAccessType: communityOfferEnabled
        ? input.communityAccessType ?? "LIFETIME"
        : null,
      communityBenefitsJson: communityOfferEnabled
        ? safeJsonArray(input.communityBenefitsJson)
        : "[]",
      communityId,
      status: finalStatus,
      publishedAt: finalStatus === ContentStatus.PUBLISHED ? new Date() : null,
    };

    const ebook = await prisma.ebook.upsert({
      where: { slug: input.slug },
      update: data,
      create: {
        slug: input.slug,
        ...data,
        authorId: session.user.id,
      },
      include: {
        community: { select: { id: true, slug: true, name: true } },
      },
    });

    // Keep CommunityEbookLink in sync for bundle membership grants.
    await prisma.communityEbookLink.deleteMany({ where: { ebookId: ebook.id } });
    if (communityOfferEnabled && communityId) {
      await prisma.communityEbookLink.create({
        data: { ebookId: ebook.id, communityId },
      });
    }

    return NextResponse.json({ ebook });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
    }
    console.error("Unable to save ebook:", error);
    return NextResponse.json({ error: "Unable to save ebook." }, { status: 500 });
  }
}
