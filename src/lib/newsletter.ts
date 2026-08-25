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

export async function ensureNewsletterPlans(productId: string) {
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

  return prisma.newsletterPlan.findMany({
    where: { productId, isActive: true },
    orderBy: { sortOrder: "asc" },
  });
}

/** Ensure a newsletter community + product + plans exist (singleton). */
export async function ensureNewsletterProduct(adminUserId?: string) {
  let existing = await prisma.newsletterProduct.findFirst({
    include: {
      community: true,
      plans: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

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

    existing = await prisma.newsletterProduct.create({
      data: {
        title: "NEPSE Weekly",
        description:
          "Weekly market research + 1-hour live session for Nepali investors.",
        priceNpr: 999,
        paymentInstructions: "Scan the QR, pay, then upload your receipt for unlock.",
        isActive: true,
        communityId: community.id,
      },
      include: {
        community: true,
        plans: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      },
    });
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

export async function getActiveNewsletterProduct() {
  let product = await prisma.newsletterProduct.findFirst({
    where: { isActive: true },
    include: {
      community: true,
      plans: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  });

  if (!product) {
    product = await ensureNewsletterProduct();
  } else if (!product.plans.length) {
    const plans = await ensureNewsletterPlans(product.id);
    product = { ...product, plans };
  }

  return product;
}

export async function getNewsletterPlanByCode(productId: string, code: string) {
  return prisma.newsletterPlan.findUnique({
    where: { productId_code: { productId, code: code.toUpperCase() } },
  });
}

export async function getNewsletterProductForUser(userId: string) {
  const product = await getActiveNewsletterProduct();
  if (!product) return null;

  const approved = await prisma.newsletterOrder.findFirst({
    where: {
      userId,
      productId: product.id,
      paymentStatus: PaymentStatus.APPROVED,
    },
    include: { plan: true },
    orderBy: { reviewedAt: "desc" },
  });

  const pending = await prisma.newsletterOrder.findFirst({
    where: {
      userId,
      productId: product.id,
      paymentStatus: PaymentStatus.PENDING,
      receiptPath: { not: null },
    },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const order = approved ?? pending;

  return {
    ...product,
    order,
    paymentStatus: order?.paymentStatus ?? null,
  };
}

export async function userHasApprovedNewsletter(userId: string, productId: string) {
  const approved = await prisma.newsletterOrder.findFirst({
    where: { userId, productId, paymentStatus: PaymentStatus.APPROVED },
    select: { id: true },
  });
  return Boolean(approved);
}
