import {
  CommunityMemberRole,
  CommunityStatus,
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

/** Upsert membership for every community linked to an approved ebook order. */
export async function ensureCommunityMembershipsForEbookOrder(orderId: string) {
  const order = await prisma.ebookOrder.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      userId: true,
      ebookId: true,
      paymentStatus: true,
    },
  });

  if (!order || order.paymentStatus !== PaymentStatus.APPROVED) {
    return [];
  }

  const links = await prisma.communityEbookLink.findMany({
    where: {
      ebookId: order.ebookId,
      community: { status: CommunityStatus.ACTIVE },
    },
    select: { communityId: true },
  });

  const members = [];
  for (const link of links) {
    const existing = await prisma.communityMember.findUnique({
      where: {
        communityId_userId: {
          communityId: link.communityId,
          userId: order.userId,
        },
      },
    });

    if (existing?.bannedAt) {
      continue;
    }

    const member = await prisma.communityMember.upsert({
      where: {
        communityId_userId: {
          communityId: link.communityId,
          userId: order.userId,
        },
      },
      update: {},
      create: {
        communityId: link.communityId,
        userId: order.userId,
        role: CommunityMemberRole.MEMBER,
      },
    });
    members.push(member);
  }

  return members;
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

  const communityId = order.product.communityId;
  const existing = await prisma.communityMember.findUnique({
    where: {
      communityId_userId: { communityId, userId: order.userId },
    },
  });

  if (existing?.bannedAt) {
    return existing;
  }

  return prisma.communityMember.upsert({
    where: {
      communityId_userId: { communityId, userId: order.userId },
    },
    update: {},
    create: {
      communityId,
      userId: order.userId,
      role: CommunityMemberRole.MEMBER,
    },
  });
}

/** Backfill memberships from approved ebook + newsletter purchases. */
export async function syncUserCommunityMemberships(userId: string) {
  const [ebookOrders, newsletterOrders] = await Promise.all([
    prisma.ebookOrder.findMany({
      where: { userId, paymentStatus: PaymentStatus.APPROVED },
      select: { id: true },
    }),
    prisma.newsletterOrder.findMany({
      where: { userId, paymentStatus: PaymentStatus.APPROVED },
      select: { id: true },
    }),
  ]);

  for (const order of ebookOrders) {
    await ensureCommunityMembershipsForEbookOrder(order.id);
  }
  for (const order of newsletterOrders) {
    await ensureCommunityMembershipForNewsletterOrder(order.id);
  }
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
  const member = await prisma.communityMember.findUnique({
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

  if (!member) {
    throw new CommunityAccessError("You are not a member of this community.", 403);
  }

  if (member.community.status === CommunityStatus.ARCHIVED) {
    throw new CommunityAccessError("This community is archived.", 403);
  }

  if (member.bannedAt && !options?.allowBanned) {
    throw new CommunityAccessError("You are banned from this community.", 403);
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
