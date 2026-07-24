import Link from "next/link";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getBlogPostBySlug } from "@/lib/repositories";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post || post.status !== "PUBLISHED") {
    notFound();
  }

  return (
    <div className="site-container py-xl">
      <Link href="/blog" className="text-sm font-medium text-primary">
        ← All articles
      </Link>
      <article className="mx-auto mt-6 max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Blog</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">{post.title}</h1>
        {post.titleNe && <p className="mt-2 text-lg text-primary">{post.titleNe}</p>}
        <p className="mt-3 text-sm text-on-surface-variant">
          By {post.author?.name ?? "Sikau Paisa"}
          {post.publishedAt ? ` · ${new Date(post.publishedAt).toLocaleDateString()}` : ""}
        </p>
        {post.coverImage && (
          <div className="relative mt-6 h-72 overflow-hidden rounded-3xl">
            <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
          </div>
        )}
        <Card className="mt-6 p-8">
          <div className="prose prose-sm max-w-none text-on-background">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>
        </Card>
      </article>
    </div>
  );
}
