import { BlogManager } from "@/components/admin/BlogManager";
import { getManageableBlogPosts } from "@/lib/repositories";

export default async function AdminBlogsPage() {
  const posts = await getManageableBlogPosts();

  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Blog</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Create & Publish Articles</h1>
      </div>
      <BlogManager posts={posts} />
    </section>
  );
}
