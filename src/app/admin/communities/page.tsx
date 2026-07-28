import { AdminCommunityShell } from "@/components/admin/AdminCommunityShell";
import { getManageableCommunities, getPublishedEbooksForLinking } from "@/lib/community-repositories";
import { getCurrentSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AdminCommunitiesPage() {
  const session = await getCurrentSession();
  if (session?.user.role !== "ADMIN" || !session.user.id) {
    redirect("/admin");
  }

  const [communities, ebooks] = await Promise.all([
    getManageableCommunities(),
    getPublishedEbooksForLinking(),
  ]);

  const initialCommunities = communities.map((community) => ({
    id: community.id,
    slug: community.slug,
    name: community.name,
    description: community.description,
    coverImage: community.coverImage,
    status: community.status as "ACTIVE" | "ARCHIVED",
    permissions: community.permissions,
    ebookLinks: community.ebookLinks.map((link) => ({
      ebook: {
        id: link.ebook.id,
        slug: link.ebook.slug,
        title: link.ebook.title,
      },
    })),
    _count: community._count,
    lastMessage: community.lastMessage
      ? {
          id: community.lastMessage.id,
          body: community.lastMessage.body,
          type: community.lastMessage.type,
          createdAt:
            typeof community.lastMessage.createdAt === "string"
              ? community.lastMessage.createdAt
              : community.lastMessage.createdAt.toISOString(),
          authorName: community.lastMessage.authorName,
        }
      : null,
  }));

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Community</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Communities</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          WhatsApp-style groups — create communities, chat live, and moderate members.
        </p>
      </div>
      <AdminCommunityShell
        initialCommunities={initialCommunities}
        ebooks={ebooks}
        currentUserId={session.user.id}
      />
    </section>
  );
}
