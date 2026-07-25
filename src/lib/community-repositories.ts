import { CommunityStatus, PaymentStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { syncUserCommunityMemberships } from "@/lib/community-access";

const messageInclude = {
  author: { select: { id: true, name: true, email: true } },
  attachments: true,
  reactions: {
    select: { id: true, emoji: true, userId: true },
  },
  replyTo: {
    select: {
      id: true,
      body: true,
      type: true,
      author: { select: { id: true, name: true } },
      deletedAt: true,
    },
  },
} satisfies Prisma.CommunityMessageInclude;

export async function getManageableCommunities() {
  return prisma.community.findMany({
    include: {
      ebookLinks: { include: { ebook: { select: { id: true, slug: true, title: true } } } },
      _count: { select: { members: true, messages: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCommunityById(id: string) {
  return prisma.community.findUnique({
    where: { id },
    include: {
      ebookLinks: { include: { ebook: { select: { id: true, slug: true, title: true } } } },
      _count: { select: { members: true, messages: true } },
    },
  });
}

export async function getCommunityBySlug(slug: string) {
  return prisma.community.findUnique({
    where: { slug },
    include: {
      ebookLinks: { include: { ebook: { select: { id: true, slug: true, title: true } } } },
      announcements: {
        where: { pinned: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });
}

export async function getUserCommunities(userId: string) {
  await syncUserCommunityMemberships(userId);

  const memberships = await prisma.communityMember.findMany({
    where: {
      userId,
      bannedAt: null,
      community: { status: CommunityStatus.ACTIVE },
    },
    include: {
      community: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  const results = [];
  for (const membership of memberships) {
    const lastMessage = await prisma.communityMessage.findFirst({
      where: {
        communityId: membership.communityId,
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
      },
    });

    const unreadCount = await prisma.communityMessage.count({
      where: {
        communityId: membership.communityId,
        deletedAt: null,
        createdAt: membership.lastReadAt
          ? { gt: membership.lastReadAt }
          : undefined,
        authorId: { not: userId },
      },
    });

    results.push({
      id: membership.community.id,
      slug: membership.community.slug,
      name: membership.community.name,
      description: membership.community.description,
      coverImage: membership.community.coverImage,
      role: membership.role,
      lastReadAt: membership.lastReadAt,
      unreadCount,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            body: lastMessage.deletedAt ? "Message removed" : lastMessage.body,
            type: lastMessage.type,
            createdAt: lastMessage.createdAt,
            authorName: lastMessage.author.name ?? "Member",
          }
        : null,
    });
  }

  results.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt?.getTime() ?? 0;
    const bTime = b.lastMessage?.createdAt?.getTime() ?? 0;
    return bTime - aTime;
  });

  return results;
}

export async function listCommunityMessages(options: {
  communityId: string;
  before?: string;
  after?: string;
  limit?: number;
  search?: string;
}) {
  const limit = Math.min(Math.max(options.limit ?? 40, 1), 100);

  let cursorCreatedAt: Date | undefined;
  if (options.before) {
    const beforeMsg = await prisma.communityMessage.findUnique({
      where: { id: options.before },
      select: { createdAt: true },
    });
    cursorCreatedAt = beforeMsg?.createdAt;
  }

  let afterCreatedAt: Date | undefined;
  if (options.after) {
    const afterMsg = await prisma.communityMessage.findUnique({
      where: { id: options.after },
      select: { createdAt: true },
    });
    afterCreatedAt = afterMsg?.createdAt;
  }

  const where: Prisma.CommunityMessageWhereInput = {
    communityId: options.communityId,
    deletedAt: null,
    ...(options.search
      ? { body: { contains: options.search, mode: "insensitive" } }
      : {}),
    ...(cursorCreatedAt ? { createdAt: { lt: cursorCreatedAt } } : {}),
    ...(afterCreatedAt ? { createdAt: { gt: afterCreatedAt } } : {}),
  };

  const messages = await prisma.communityMessage.findMany({
    where,
    include: messageInclude,
    orderBy: { createdAt: afterCreatedAt ? "asc" : "desc" },
    take: limit,
  });

  return afterCreatedAt ? messages : messages.reverse();
}

export async function getPinnedMessages(communityId: string) {
  return prisma.communityMessage.findMany({
    where: {
      communityId,
      pinnedAt: { not: null },
      deletedAt: null,
    },
    include: messageInclude,
    orderBy: { pinnedAt: "desc" },
    take: 10,
  });
}

export async function listCommunityMembers(communityId: string) {
  return prisma.communityMember.findMany({
    where: { communityId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
    },
    orderBy: [{ role: "asc" }, { joinedAt: "asc" }],
  });
}

export async function getPublishedEbooksForLinking() {
  return prisma.ebook.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, title: true, priceNpr: true },
    orderBy: { title: "asc" },
  });
}

export async function userHasAnyCommunityMembership(userId: string) {
  const approvedLinked = await prisma.ebookOrder.count({
    where: {
      userId,
      paymentStatus: PaymentStatus.APPROVED,
      ebook: { communityLinks: { some: {} } },
    },
  });
  if (approvedLinked > 0) return true;

  const member = await prisma.communityMember.count({
    where: { userId, bannedAt: null },
  });
  return member > 0;
}
