import { CommunityManager } from "@/components/admin/CommunityManager";
import { getManageableCommunities, getPublishedEbooksForLinking } from "@/lib/community-repositories";

export default async function AdminCommunitiesPage() {
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
  }));

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Community</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Manage communities</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Create communities, link ebook packages, moderate members and messages.
        </p>
      </div>
      <CommunityManager initialCommunities={initialCommunities} ebooks={ebooks} />
    </section>
  );
}
