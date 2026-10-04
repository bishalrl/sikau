import Link from "next/link";
import Image from "next/image";
import { getPublishedBlogPosts } from "@/lib/repositories";

export default async function BlogPage() {
  const posts = await getPublishedBlogPosts();

  return (
    <div className="site-container py-xl">
      <div className="reveal max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">Blog</p>
        <h1 className="mt-2 font-display-md text-display-md text-on-background">Finance insights & guides</h1>
        <p className="mt-sm section-intro font-body-md text-on-surface-variant">
          Practical articles on saving, SIP, insurance, and wealth building for Nepali households.
        </p>
      </div>

      <div className="mt-lg grid gap-md sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post, index) => (
          <Link
            key={post.id}
            href={`/blog/${post.slug}`}
            className={`blog-card reveal group overflow-hidden rounded-3xl border border-outline-variant/30 bg-white ${["delay-100", "delay-200", "delay-250", "delay-300"][index % 4]}`}
          >
            <div className="media-zoom relative h-44 bg-surface-container">
              {post.coverImage && (
                <Image src={post.coverImage} alt={post.title} fill className="object-cover" />
              )}
            </div>
            <div className="p-md">
              <h2 className="blog-card__title font-headline-md text-on-background transition-colors">
                {post.title}
              </h2>
              {post.titleNe && <p className="mt-1 text-sm text-primary">{post.titleNe}</p>}
              <p className="mt-sm line-clamp-3 text-sm text-on-surface-variant">{post.excerpt}</p>
              <p className="mt-3 text-sm font-semibold text-primary">
                Read article <span className="blog-card__arrow" aria-hidden="true">→</span>
              </p>
            </div>
          </Link>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="mt-lg text-sm text-on-surface-variant">No published articles yet.</p>
      )}
    </div>
  );
}
