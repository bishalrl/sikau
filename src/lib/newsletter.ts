import { CommunityMemberRole, CommunityStatus, PaymentStatus } from "@prisma/client";
import { NEWSLETTER_COMMUNITY_PERMISSIONS } from "@/lib/community-access";
import { prisma } from "@/lib/prisma";

const DEFAULT_SLUG = "newsletter-updates";

export const DEFAULT_NEWSLETTER_PLANS = [
  {
    code: "MONTHLY",
    label: "Monthly",
    priceNpr: 999,
    listPriceNpr: null as number | null,
    discountPercent: null as number | null,
    perDayNpr: 33,
    badge: null as string | null,
    sortOrder: 0,
  },
  {
    code: "QUARTERLY",
    label: "3 Months",
    priceNpr: 2499,
    listPriceNpr: 2997,
    discountPercent: 17,
    perDayNpr: 28,
    badge: "MOST_POPULAR",
    sortOrder: 1,
  },
  {
    code: "SEMIANNUAL",
    label: "6 Months",
    priceNpr: 4499,
    listPriceNpr: 5994,
    discountPercent: 25,
    perDayNpr: 25,
    badge: null,
    sortOrder: 2,
  },
  {
    code: "YEARLY",
    label: "Yearly",
    priceNpr: 7999,
    listPriceNpr: 11988,
    discountPercent: 33,
    perDayNpr: 22,
    badge: "BEST_VALUE",
    sortOrder: 3,
  },
] as const;

export type NewsletterPlanView = {
  id: string;
  productId: string;
  code: string;
  label: string;
  priceNpr: number;
  listPriceNpr: number | null;
  discountPercent: number | null;
  perDayNpr: number | null;
  badge: string | null;
  sortOrder: number;
  isActive: boolean;
};

type NewsletterCommunity = {
  id: string;
  slug: string;
  name: string;
  description: string;
  coverImage: string | null;
  permissions: string;
  status: CommunityStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type NewsletterProductView = {
  id: string;
  title: string;
  description: string;
  priceNpr: number;
  coverImage: string | null;
  samplePdfPath: string | null;
  previewImagesJson: string;
  paymentQrPath: string | null;
  paymentInstructions: string | null;
  isActive: boolean;
  communityId: string;
  createdAt: Date;
  updatedAt: Date;
  community: NewsletterCommunity;
  plans: NewsletterPlanView[];
};

function isMissingPlanSchemaError(error: unknown) {
  const text = [
    error instanceof Error ? error.message : "",
    typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "",
    typeof error === "object" && error && "meta" in error ? JSON.stringify((error as { meta?: unknown }).meta) : "",
    error instanceof Error && error.cause ? String(error.cause) : "",
    String(error),
  ]
    .join(" ")
    .toLowerCase();

  return (
    text.includes("newsletterplan") ||
    text.includes("planid") ||
    (text.includes("p2021") && text.includes("newsletter")) ||
    (text.includes("tabledoesnotexist") && text.includes("newsletter"))
  );
}

/** Load product without joining plans, then attach plans (or fallbacks). */
async function findNewsletterProductWithPlans(): Promise<NewsletterProductView | null> {
  const product = await prisma.newsletterProduct.findFirst({
    include: { community: true },
    orderBy: { createdAt: "asc" },
  });
  if (!product) return null;

  try {
    const plans = await prisma.newsletterPlan.findMany({
      where: { productId: product.id, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return {
      ...product,
      plans: toPlanViews(product.id, plans),
    };
  } catch (error) {
    if (!isMissingPlanSchemaError(error)) throw error;
    console.error(
      "NewsletterPlan table missing during product load. Run `npx prisma db push` on the server.",
      error,
    );
    return {
      ...product,
      plans: fallbackPlans(product.id),
    };
  }
}

function fallbackPlans(productId: string): NewsletterPlanView[] {
  return DEFAULT_NEWSLETTER_PLANS.map((plan, index) => ({
    id: `fallback-${plan.code}`,
    productId,
    code: plan.code,
    label: plan.label,
    priceNpr: plan.priceNpr,
    listPriceNpr: plan.listPriceNpr,
    discountPercent: plan.discountPercent,
    perDayNpr: plan.perDayNpr,
    badge: plan.badge,
    sortOrder: plan.sortOrder ?? index,
    isActive: true,
  }));
}

function toPlanViews(
  productId: string,
  plans: Array<{
    id: string;
    productId: string;
    code: string;
    label: string;
    priceNpr: number;
    listPriceNpr: number | null;
    discountPercent: number | null;
    perDayNpr: number | null;
    badge: string | null;
    sortOrder: number;
    isActive: boolean;
  }>,
): NewsletterPlanView[] {
  return plans.map((plan) => ({
    id: plan.id,
    productId: plan.productId || productId,
    code: plan.code,
    label: plan.label,
    priceNpr: plan.priceNpr,
    listPriceNpr: plan.listPriceNpr,
    discountPercent: plan.discountPercent,
    perDayNpr: plan.perDayNpr,
    badge: plan.badge,
    sortOrder: plan.sortOrder,
    isActive: plan.isActive,
  }));
}

export async function ensureNewsletterPlans(productId: string): Promise<NewsletterPlanView[]> {
  try {
    for (const plan of DEFAULT_NEWSLETTER_PLANS) {
      await prisma.newsletterPlan.upsert({
        where: {
          productId_code: { productId, code: plan.code },
        },
        update: {
          isActive: true,
        },
        create: {
          productId,
          code: plan.code,
          label: plan.label,
          priceNpr: plan.priceNpr,
          listPriceNpr: plan.listPriceNpr,
          discountPercent: plan.discountPercent,
          perDayNpr: plan.perDayNpr,
          badge: plan.badge,
          sortOrder: plan.sortOrder,
          isActive: true,
        },
      });
    }

    const plans = await prisma.newsletterPlan.findMany({
      where: { productId, isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    return toPlanViews(productId, plans);
  } catch (error) {
    if (isMissingPlanSchemaError(error)) {
      console.error(
        "NewsletterPlan table/column missing. Run `npx prisma db push` on the server.",
        error,
      );
      return fallbackPlans(productId);
    }
    throw error;
  }
}

/** Ensure a newsletter community + product + plans exist (singleton). */
export async function ensureNewsletterProduct(adminUserId?: string): Promise<NewsletterProductView> {
  let existing = await findNewsletterProductWithPlans();

  if (!existing) {
    const community = await prisma.community.upsert({
      where: { slug: DEFAULT_SLUG },
      update: {
        name: "NEPSE Weekly",
        description: "Weekly market research + live session — members can read only.",
        permissions: NEWSLETTER_COMMUNITY_PERMISSIONS,
        status: CommunityStatus.ACTIVE,
      },
      create: {
        slug: DEFAULT_SLUG,
        name: "NEPSE Weekly",
        description: "Weekly market research + live session — members can read only.",
        permissions: NEWSLETTER_COMMUNITY_PERMISSIONS,
        status: CommunityStatus.ACTIVE,
      },
    });

    if (adminUserId) {
      await prisma.communityMember.upsert({
        where: {
          communityId_userId: { communityId: community.id, userId: adminUserId },
        },
        update: { role: CommunityMemberRole.ADMIN, bannedAt: null },
        create: {
          communityId: community.id,
          userId: adminUserId,
          role: CommunityMemberRole.ADMIN,
        },
      });
    }

    const created = await prisma.newsletterProduct.create({
      data: {
        title: "NEPSE Weekly",
        description:
          "Weekly market research + 1-hour live session for Nepali investors.",
        priceNpr: 999,
        paymentInstructions: "Scan the QR, pay, then upload your receipt for unlock.",
        isActive: true,
        communityId: community.id,
      },
      include: { community: true },
    });

    existing = {
      ...created,
      plans: [],
    };
  } else if (adminUserId) {
    await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId: existing.communityId,
          userId: adminUserId,
        },
      },
      update: { role: CommunityMemberRole.ADMIN, bannedAt: null },
      create: {
        communityId: existing.communityId,
        userId: adminUserId,
        role: CommunityMemberRole.ADMIN,
      },
    });
  }

  const plans = await ensureNewsletterPlans(existing.id);
  return { ...existing, plans };
}

export async function getActiveNewsletterProduct(): Promise<NewsletterProductView | null> {
  let product = await findNewsletterProductWithPlans();

  if (!product) {
    product = await ensureNewsletterProduct();
  } else if (!product.plans.length) {
    const plans = await ensureNewsletterPlans(product.id);
    product = { ...product, plans };
  }

  return product;
}

export async function getNewsletterPlanByCode(productId: string, code: string) {
  try {
    return await prisma.newsletterPlan.findUnique({
      where: { productId_code: { productId, code: code.toUpperCase() } },
    });
  } catch (error) {
    if (!isMissingPlanSchemaError(error)) throw error;
    return fallbackPlans(productId).find((plan) => plan.code === code.toUpperCase()) ?? null;
  }
}

export async function getNewsletterProductForUser(userId: string) {
  const product = await getActiveNewsletterProduct();
  if (!product) return null;

  // Avoid selecting planId / joining NewsletterPlan so older DBs still load the page.
  const orderSelect = {
    id: true,
    userId: true,
    productId: true,
    amount: true,
    currency: true,
    paymentStatus: true,
    receiptPath: true,
    notes: true,
    reviewedById: true,
    reviewedAt: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  try {
    const approved = await prisma.newsletterOrder.findFirst({
      where: {
        userId,
        productId: product.id,
        paymentStatus: PaymentStatus.APPROVED,
      },
      select: orderSelect,
      orderBy: { reviewedAt: "desc" },
    });

    const pending = await prisma.newsletterOrder.findFirst({
      where: {
        userId,
        productId: product.id,
        paymentStatus: PaymentStatus.PENDING,
        receiptPath: { not: null },
      },
      select: orderSelect,
      orderBy: { createdAt: "desc" },
    });

    const order = approved ?? pending;

    return {
      ...product,
      order: order ? { ...order, plan: null } : null,
      paymentStatus: order?.paymentStatus ?? null,
    };
  } catch (error) {
    console.error("Newsletter order lookup failed; continuing without order state.", error);
    return {
      ...product,
      order: null,
      paymentStatus: null,
    };
  }
}

export async function userHasApprovedNewsletter(userId: string, productId: string) {
  const approved = await prisma.newsletterOrder.findFirst({
    where: { userId, productId, paymentStatus: PaymentStatus.APPROVED },
    select: { id: true },
  });
  return Boolean(approved);
}
