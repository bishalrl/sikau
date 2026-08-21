import { CommunityMemberRole, CommunityStatus } from "@prisma/client";
import { NEWSLETTER_COMMUNITY_PERMISSIONS } from "@/lib/community-access";
import { prisma } from "@/lib/prisma";

const DEFAULT_SLUG = "newsletter-updates";

/** Ensure a newsletter community + product exist (singleton). */
export async function ensureNewsletterProduct(adminUserId?: string) {
  const existing = await prisma.newsletterProduct.findFirst({
    include: {
      community: true,
      orders: {
        where: { paymentStatus: "APPROVED" },
        select: { id: true },
        take: 1,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  if (existing) {
    return existing;
  }

  const community = await prisma.community.upsert({
    where: { slug: DEFAULT_SLUG },
    update: {
      name: "Newsletter Updates",
      description: "Paid newsletter updates — members can read only.",
      permissions: NEWSLETTER_COMMUNITY_PERMISSIONS,
      status: CommunityStatus.ACTIVE,
    },
    create: {
      slug: DEFAULT_SLUG,
      name: "Newsletter Updates",
      description: "Paid newsletter updates — members can read only.",
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

  return prisma.newsletterProduct.create({
    data: {
      title: "Sikau Paisa Newsletter",
      description:
        "Get market and money updates in a private community feed. Pay once, then read every incoming update.",
      priceNpr: 999,
      paymentInstructions: "Scan the QR, pay, then upload your receipt for unlock.",
      isActive: true,
      communityId: community.id,
    },
    include: {
      community: true,
      orders: {
        where: { paymentStatus: "APPROVED" },
        select: { id: true },
        take: 1,
      },
    },
  });
}

export async function getActiveNewsletterProduct() {
  let product = await prisma.newsletterProduct.findFirst({
    where: { isActive: true },
    include: { community: true },
    orderBy: { createdAt: "asc" },
  });

  if (!product) {
    product = await ensureNewsletterProduct();
  }

  return product;
}

export async function getNewsletterProductForUser(userId: string) {
  const product = await getActiveNewsletterProduct();
  if (!product) return null;

  const order = await prisma.newsletterOrder.findUnique({
    where: {
      userId_productId: { userId, productId: product.id },
    },
  });

  return { ...product, order, paymentStatus: order?.paymentStatus ?? null };
}
