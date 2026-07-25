import {
  CommunityMemberRole,
  CommunityStatus,
  PaymentStatus,
  type CommunityMember,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

/** Backfill memberships from any approved community-linked ebook purchases. */
export async function syncUserCommunityMemberships(userId: string) {
  const approvedOrders = await prisma.ebookOrder.findMany({
    where: { userId, paymentStatus: PaymentStatus.APPROVED },
    select: { id: true },
  });

  for (const order of approvedOrders) {
    await ensureCommunityMembershipsForEbookOrder(order.id);
  }
}

export async function assertCommunityMember(
  userId: string,
  communityId: string,
  options?: { allowBanned?: boolean },
): Promise<CommunityMember & { community: { permissions: string; status: CommunityStatus; slug: string; name: string } }> {
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
