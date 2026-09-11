import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { ContentStatus, PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL required");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const nepseCurriculum = JSON.stringify([
  { phase: "Phase 1", title: "Mindset & Introduction", detail: "Build the right foundation before you place a single trade." },
  { phase: "Phase 2", title: "Stock Market Basics", detail: "Understand how NEPSE works in clear, practical language." },
  { phase: "Phase 3", title: "Technical Analysis Foundations", detail: "Read charts with confidence using essential tools." },
  { phase: "Phase 4", title: "Core Trading Strategies", detail: "Apply 3 proven strategies designed for Nepali markets." },
  { phase: "Phase 5", title: "Risk Management & Execution", detail: "Protect capital and execute trades with discipline." },
  { phase: "Phase 6", title: "Psychology & Next Steps", detail: "Master emotions and create your personal trading plan." },
]);
const nepseAudience = JSON.stringify([
  "Complete beginners with zero trading knowledge",
  "Anyone who has lost money and wants to understand why",
  "People who want a calm, practical approach",
]);
const nepseBenefits = JSON.stringify([
  "Monthly live sessions",
  "Q&A",
  "Community discussion",
  "Accountability",
]);

const NEPSE_COVER = "/rajuimageandqr/ebook-cover.jpeg";

async function main() {
  const nepseCommunity = await prisma.community.upsert({
    where: { slug: "nepse-lifetime-community" },
    update: {
      name: "NEPSE Trading Community",
      description: "Exclusive trading community for NEPSE Guide community-bundle members.",
      coverImage: NEPSE_COVER,
      status: "ACTIVE",
    },
    create: {
      slug: "nepse-lifetime-community",
      name: "NEPSE Trading Community",
      description: "Exclusive trading community for NEPSE Guide community-bundle members.",
      coverImage: NEPSE_COVER,
      status: "ACTIVE",
      permissions: JSON.stringify({ text: "ALL", media: "ALL", voice: "MODS" }),
    },
  });

  const guide = await prisma.ebook.update({
    where: { slug: "nepse-trading-guide" },
    data: {
      headline:
        "From Confused to Confident: Your Step-by-Step Guide to Professional Trading in NEPSE.",
      description:
        "NEPSE trading foundations — 3 strategies, 7 indicators, and a clear roadmap for Nepali investors.",
      curriculumJson: nepseCurriculum,
      audienceJson: nepseAudience,
      priceNpr: 599,
      isFree: false,
      communityOfferEnabled: true,
      communityOfferName: "NEPSE Trading Community",
      communityOfferPriceNpr: 999,
      communityAccessType: "LIFETIME",
      communityBenefitsJson: nepseBenefits,
      communityId: nepseCommunity.id,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
  });

  await prisma.ebook.updateMany({
    where: { slug: "nepse-trading-community" },
    data: {
      status: ContentStatus.DRAFT,
      title: "NEPSE Guide + Community (legacy SKU)",
      description: "Legacy product row. Use /ebooks/nepse-trading-guide community offer instead.",
    },
  });

  await prisma.communityEbookLink.deleteMany({ where: { ebookId: guide.id } });
  await prisma.communityEbookLink.create({
    data: { ebookId: guide.id, communityId: nepseCommunity.id },
  });

  const author =
    (await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true },
      orderBy: { createdAt: "asc" },
    })) ||
    (await prisma.user.findFirst({ select: { id: true }, orderBy: { createdAt: "asc" } }));

  if (!author) {
    throw new Error("No user found to own catalog ebooks. Create an admin user first.");
  }

  // Upsert catalog ebooks so production never 404s if seed never ran.
  await prisma.ebook.upsert({
    where: { slug: "sip-action-plan" },
    update: {
      title: "SIP Action Plan Ebook",
      description: "A paid guide with ready-to-use SIP target tables and monthly checklists.",
      curriculumJson: JSON.stringify([
        { phase: "Phase 1", title: "Find your surplus", detail: "Decide your monthly investable surplus." },
        { phase: "Phase 2", title: "Pick funds", detail: "Choose 1–2 diversified funds." },
        { phase: "Phase 3", title: "Automate", detail: "Automate the SIP date with your salary cycle." },
      ]),
      audienceJson: JSON.stringify([
        "Salary earners starting SIPs",
        "Anyone who wants a simple monthly investing system",
      ]),
      communityOfferEnabled: false,
      communityOfferName: null,
      communityOfferPriceNpr: null,
      communityAccessType: null,
      communityBenefitsJson: "[]",
      communityId: null,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
      slug: "sip-action-plan",
      title: "SIP Action Plan Ebook",
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
      communityOfferEnabled: false,
      communityBenefitsJson: "[]",
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: author.id,
    },
  });

  await prisma.ebook.upsert({
    where: { slug: "money-mindset-workbook" },
    update: {
      title: "Money Mindset Workbook",
      description: "Free workbook to reset money habits and build a calm personal finance baseline.",
      curriculumJson: JSON.stringify([
        { phase: "Part 1", title: "Money stories", detail: "Map the beliefs shaping your spending." },
        { phase: "Part 2", title: "Cashflow clarity", detail: "See where money actually goes." },
        { phase: "Part 3", title: "Habit systems", detail: "Build weekly money routines that stick." },
      ]),
      audienceJson: JSON.stringify([
        "Beginners who feel anxious about money",
        "Anyone rebuilding financial confidence",
      ]),
      isFree: true,
      priceNpr: 0,
      communityOfferEnabled: false,
      communityOfferName: null,
      communityOfferPriceNpr: null,
      communityAccessType: null,
      communityBenefitsJson: "[]",
      communityId: null,
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
    },
    create: {
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
      filePath: null,
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
      communityOfferEnabled: false,
      communityBenefitsJson: "[]",
      status: ContentStatus.PUBLISHED,
      publishedAt: new Date(),
      authorId: author.id,
    },
  });

  const legacy = await prisma.ebook.findUnique({
    where: { slug: "nepse-trading-community" },
    select: { id: true },
  });
  if (legacy) {
    const legacyOrders = await prisma.ebookOrder.findMany({ where: { ebookId: legacy.id } });
    for (const order of legacyOrders) {
      const existing = await prisma.ebookOrder.findUnique({
        where: { userId_ebookId: { userId: order.userId, ebookId: guide.id } },
      });
      if (!existing) {
        await prisma.ebookOrder.create({
          data: {
            userId: order.userId,
            ebookId: guide.id,
            purchaseType: "COMMUNITY_BUNDLE",
            amount: order.amount || 999,
            currency: order.currency,
            paymentStatus: order.paymentStatus,
            receiptPath: order.receiptPath,
            notes: order.notes,
            reviewedById: order.reviewedById,
            reviewedAt: order.reviewedAt,
          },
        });
      } else if (order.paymentStatus === "APPROVED") {
        await prisma.ebookOrder.update({
          where: { id: existing.id },
          data: {
            purchaseType: "COMMUNITY_BUNDLE",
            paymentStatus: "APPROVED",
            amount: Math.max(existing.amount, order.amount || 999),
          },
        });
      }
    }
  }

  console.log("Migrated ebook community offers.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
