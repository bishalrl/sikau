import { ContentStatus, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Canonical NEPSE guide slug (community is an offer on this ebook, not a second SKU). */
export const CANONICAL_NEPSE_EBOOK_SLUG = "nepse-trading-guide";
export const LEGACY_NEPSE_BUNDLE_SLUG = "nepse-trading-community";

const CATALOG_EBOOKS = [
  {
    slug: "money-mindset-workbook",
    title: "Money Mindset Workbook",
    titleNe: "पैसा सोच अभ्यास पुस्तक",
    description: "Free workbook to reset money habits and build a calm personal finance baseline.",
    content: `## Chapter 1 — Money Awareness

Before you invest, you need clarity.

### Daily money check-in
- What did I earn today?
- What did I spend today?
- Was the spending planned?

## Chapter 2 — Needs vs Wants

List your top 10 monthly expenses and mark each as **Need** or **Want**.

## Chapter 3 — First SIP Habit

Start with a small monthly SIP you can continue for 12 months without stress.`,
    coverImage: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=600&h=800&fit=crop",
    priceNpr: 0,
    isFree: true,
    curriculumJson: JSON.stringify([
      { phase: "Part 1", title: "Money stories", detail: "Map the beliefs shaping your spending." },
      { phase: "Part 2", title: "Cashflow clarity", detail: "See where money actually goes." },
      { phase: "Part 3", title: "Habit systems", detail: "Build weekly money routines that stick." },
    ]),
    audienceJson: JSON.stringify([
      "Beginners who feel anxious about money",
      "Anyone rebuilding financial confidence",
    ]),
  },
  {
    slug: "sip-action-plan",
    title: "SIP Action Plan Ebook",
    titleNe: null as string | null,
    description: "A paid guide with ready-to-use SIP target tables and monthly checklists.",
    content:
      "## Why SIP works\n\nSmall monthly contributions compound over time.\n\n## Starter checklist\n\n- Open a DEMAT account\n- Choose a diversified fund\n- Automate the monthly amount",
    coverImage: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=500&fit=crop",
    priceNpr: 499,
    isFree: false,
    curriculumJson: JSON.stringify([
      { phase: "Phase 1", title: "Find your surplus", detail: "Decide your monthly investable surplus." },
      { phase: "Phase 2", title: "Pick funds", detail: "Choose 1–2 diversified funds." },
      { phase: "Phase 3", title: "Automate", detail: "Automate the SIP date with your salary cycle." },
    ]),
    audienceJson: JSON.stringify([
      "Salary earners starting SIPs",
      "Anyone who wants a simple monthly investing system",
    ]),
  },
] as const;

async function resolveCatalogAuthorId(): Promise<string | null> {
  const admin = await prisma.user.findFirst({
    where: { role: UserRole.ADMIN },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (admin) return admin.id;

  const anyUser = await prisma.user.findFirst({
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  return anyUser?.id ?? null;
}

/** Keep catalog ebooks present + published; hide legacy NEPSE community SKU. */
export async function ensureSiteEbooksPublished() {
  try {
    await prisma.ebook.updateMany({
      where: {
        slug: CANONICAL_NEPSE_EBOOK_SLUG,
        status: { not: ContentStatus.PUBLISHED },
      },
      data: {
        status: ContentStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });

    // Hide legacy second SKU from the catalog once the offer lives on the guide.
    await prisma.ebook.updateMany({
      where: { slug: LEGACY_NEPSE_BUNDLE_SLUG },
      data: { status: ContentStatus.DRAFT },
    });

    const authorId = await resolveCatalogAuthorId();
    if (!authorId) return;

    for (const ebook of CATALOG_EBOOKS) {
      await prisma.ebook.upsert({
        where: { slug: ebook.slug },
        update: {
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          title: ebook.title,
          titleNe: ebook.titleNe,
          description: ebook.description,
          isFree: ebook.isFree,
          priceNpr: ebook.priceNpr,
          communityOfferEnabled: false,
          communityId: null,
        },
        create: {
          slug: ebook.slug,
          title: ebook.title,
          titleNe: ebook.titleNe,
          description: ebook.description,
          content: ebook.content,
          coverImage: ebook.coverImage,
          filePath: null,
          priceNpr: ebook.priceNpr,
          isFree: ebook.isFree,
          curriculumJson: ebook.curriculumJson,
          audienceJson: ebook.audienceJson,
          communityOfferEnabled: false,
          communityBenefitsJson: "[]",
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          authorId,
        },
      });
    }
  } catch (error) {
    console.error("ensureSiteEbooksPublished failed:", error);
  }
}

/** @deprecated Use CANONICAL_NEPSE_EBOOK_SLUG */
export const SITE_EBOOK_SLUGS = [CANONICAL_NEPSE_EBOOK_SLUG, LEGACY_NEPSE_BUNDLE_SLUG] as const;
