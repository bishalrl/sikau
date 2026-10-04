import {
  CommunityMemberRole,
  CommunityStatus,
  EbookPurchaseType,
  PaymentStatus,
  type CommunityMember,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const NEWSLETTER_COMMUNITY_PERMISSIONS = JSON.stringify({
  text: "ADMIN",
  media: "ADMIN",
  voice: "ADMIN",
});

export class CommunityAccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = "CommunityAccessError";
    this.status = status;
  }
}

export type CommunityPermissions = {
  text: "ALL" | "MODS" | "ADMIN";
  media: "ALL" | "MODS" | "ADMIN";
  voice: "ALL" | "MODS" | "ADMIN";
};

export function parseCommunityPermissions(raw?: string | null): CommunityPermissions {
  try {
    const parsed = JSON.parse(raw || "{}") as Partial<CommunityPermissions>;
    return {
      text: parsed.text ?? "ALL",
      media: parsed.media ?? "ALL",
      voice: parsed.voice ?? "MODS",
    };
  } catch {
    return { text: "ALL", media: "ALL", voice: "MODS" };
  }
}

function roleRank(role: CommunityMemberRole) {
  if (role === CommunityMemberRole.ADMIN) return 3;
  if (role === CommunityMemberRole.MODERATOR) return 2;
  return 1;
}

function canUse(level: "ALL" | "MODS" | "ADMIN", role: CommunityMemberRole) {
  if (level === "ALL") return true;
  if (level === "MODS") return roleRank(role) >= 2;
  return roleRank(role) >= 3;
}

export function memberCanSend(
  role: CommunityMemberRole,
  permissionsRaw: string | null | undefined,
  kind: "text" | "media" | "voice" = "text",
) {
  const permissions = parseCommunityPermissions(permissionsRaw);
  return canUse(permissions[kind], role);
}

function isStaffRole(role: CommunityMemberRole) {
  return roleRank(role) >= 2;
}

/**
 * Communities this user has paid for.
 * - Newsletter order → only that newsletter product's community
 * - Ebook COMMUNITY_BUNDLE → only that ebook's offer communityId
 * Never cross-grants via CommunityEbookLink fan-out.
 */
export async function getEntitledCommunityIds(userId: string): Promise<string[]> {
  const [ebookOrders, newsletterOrders] = await Promise.all([
    prisma.ebookOrder.findMany({
      where: {
        userId,
        paymentStatus: PaymentStatus.APPROVED,
        purchaseType: EbookPurchaseType.COMMUNITY_BUNDLE,
        ebook: {
          communityOfferEnabled: true,
          communityId: { not: null },
        },
      },
      select: {
        ebook: {
          select: {
            communityId: true,
            community: {
              select: {
                id: true,
                status: true,
                newsletterProduct: { select: { id: true } },
              },
            },
          },
        },
      },
    }),
    prisma.newsletterOrder.findMany({
      where: {
        userId,
        paymentStatus: PaymentStatus.APPROVED,
        product: {
          community: { status: CommunityStatus.ACTIVE },
        },
      },
      select: {
        product: { select: { communityId: true } },
      },
    }),
  ]);

  const ids = new Set<string>();

  for (const order of ebookOrders) {
    const community = order.ebook.community;
    // Ebook bundles must not unlock newsletter communities.
    if (
      community &&
      community.status === CommunityStatus.ACTIVE &&
      !community.newsletterProduct
    ) {
      ids.add(community.id);
    }
  }

  for (const order of newsletterOrders) {
    ids.add(order.product.communityId);
  }

  return [...ids];
}

export async function userHasCommunityEntitlement(userId: string, communityId: string) {
  const entitled = await getEntitledCommunityIds(userId);
  return entitled.includes(communityId);
}

async function upsertMemberIfAllowed(communityId: string, userId: string) {
  const community = await prisma.community.findFirst({
    where: { id: communityId, status: CommunityStatus.ACTIVE },
    select: { id: true },
  });
  if (!community) return null;

  const existing = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId },
    },
  });

  if (existing?.bannedAt) {
    return existing;
  }

  return prisma.communityMember.upsert({
    where: {
      communityId_userId: { communityId, userId },
    },
    update: {},
    create: {
      communityId,
      userId,
      role: CommunityMemberRole.MEMBER,
    },
  });
}

/** Upsert membership for the single offer community granted by an approved community-bundle ebook order. */
export async function ensureCommunityMembershipsForEbookOrder(orderId: string) {
  const order = await prisma.ebookOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      purchaseType: true,
      paymentStatus: true,
      ebook: {
        select: {
          communityId: true,
          communityOfferEnabled: true,
          community: {
            select: {
              id: true,
              status: true,
              newsletterProduct: { select: { id: true } },
            },
          },
        },
      },
    },
  });

  if (!order || order.paymentStatus !== PaymentStatus.APPROVED) {
    return [];
  }

  // Solo ebook purchases never unlock community access.
  if (order.purchaseType !== EbookPurchaseType.COMMUNITY_BUNDLE) {
    return [];
  }

  if (!order.ebook.communityOfferEnabled || !order.ebook.communityId) {
    return [];
  }

  const community = order.ebook.community;
  if (
    !community ||
    community.status !== CommunityStatus.ACTIVE ||
    community.newsletterProduct
  ) {
    return [];
  }

  const member = await upsertMemberIfAllowed(community.id, order.userId);
  return member ? [member] : [];
}

/** Grant read-only membership for an approved newsletter order. */
export async function ensureCommunityMembershipForNewsletterOrder(orderId: string) {
  const order = await prisma.newsletterOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      paymentStatus: true,
      product: { select: { communityId: true } },
    },
  });

  if (!order || order.paymentStatus !== PaymentStatus.APPROVED) {
    return null;
  }

  return upsertMemberIfAllowed(order.product.communityId, order.userId);
}

/** Backfill entitled memberships and remove stale MEMBER rows from over-grants. */
export async function syncUserCommunityMemberships(userId: string) {
  const entitledIds = await getEntitledCommunityIds(userId);

  for (const communityId of entitledIds) {
    await upsertMemberIfAllowed(communityId, userId);
  }

  // Drop regular member rows the user is no longer entitled to.
  // Keep ADMIN / MODERATOR (staff) memberships intact.
  await prisma.communityMember.deleteMany({
    where: {
      userId,
      role: CommunityMemberRole.MEMBER,
      bannedAt: null,
      ...(entitledIds.length > 0
        ? { communityId: { notIn: entitledIds } }
        : {}),
    },
  });
}

async function loadCommunityMember(userId: string, communityId: string) {
  return prisma.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId },
    },
    include: {
      community: {
        select: {
          permissions: true,
          status: true,
          slug: true,
          name: true,
        },
      },
    },
  });
}

export async function assertCommunityMember(
  userId: string,
  communityId: string,
  options?: { allowBanned?: boolean },
): Promise<
  CommunityMember & {
    community: { permissions: string; status: CommunityStatus; slug: string; name: string };
  }
> {
  let member = await loadCommunityMember(userId, communityId);

  // Backfill if they paid but never got a membership row yet.
  if (!member) {
    await syncUserCommunityMemberships(userId);
    member = await loadCommunityMember(userId, communityId);
  }

  if (!member) {
    throw new CommunityAccessError("You are not a member of this community.", 403);
  }

  if (member.community.status === CommunityStatus.ARCHIVED) {
    throw new CommunityAccessError("This community is archived.", 403);
  }

  if (member.bannedAt && !options?.allowBanned) {
    throw new CommunityAccessError("You are banned from this community.", 403);
  }

  // Staff keep access; paid members must still hold a live entitlement for this community.
  if (!isStaffRole(member.role)) {
    const entitled = await userHasCommunityEntitlement(userId, communityId);
    if (!entitled) {
      await prisma.communityMember.delete({ where: { id: member.id } }).catch(() => null);
      throw new CommunityAccessError("You are not a member of this community.", 403);
    }
  }

  return member;
}

export function assertCanSend(
  member: CommunityMember & { community: { permissions: string } },
  kind: "text" | "media" | "voice",
) {
  if (member.mutedUntil && member.mutedUntil.getTime() > Date.now()) {
    throw new CommunityAccessError("You are muted and cannot send messages right now.", 403);
  }

  const permissions = parseCommunityPermissions(member.community.permissions);
  if (!canUse(permissions[kind], member.role)) {
    throw new CommunityAccessError("You do not have permission to send this type of message.", 403);
  }
}

export function assertCanModerate(member: CommunityMember) {
  if (roleRank(member.role) < 2) {
    throw new CommunityAccessError("Moderator access required.", 403);
  }
}
