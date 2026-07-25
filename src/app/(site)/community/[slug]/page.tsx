import { CommunityStatus } from "@prisma/client";
import { notFound, redirect } from "next/navigation";
import { CommunityChat } from "@/components/community/CommunityChat";
import { assertCommunityMember, CommunityAccessError } from "@/lib/community-access";
import { getCommunityBySlug } from "@/lib/community-repositories";
import { getCurrentSession } from "@/lib/session";

export default async function CommunityChatPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const session = await getCurrentSession();
  const { slug } = await params;

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/community/${slug}`)}`);
  }

  const community = await getCommunityBySlug(slug);
  if (!community || community.status !== CommunityStatus.ACTIVE) {
    notFound();
  }

  try {
    await assertCommunityMember(session.user.id, community.id);
  } catch (error) {
    if (error instanceof CommunityAccessError) {
      redirect("/community");
    }
    throw error;
  }

  return (
    <div className="community-chat-page">
      <CommunityChat
        community={{
          id: community.id,
          slug: community.slug,
          name: community.name,
          description: community.description,
          coverImage: community.coverImage,
        }}
        currentUserId={session.user.id}
        announcements={community.announcements.map((item) => ({
          id: item.id,
          title: item.title,
          body: item.body,
        }))}
      />
    </div>
  );
}
