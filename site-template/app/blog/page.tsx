import type { Metadata } from "next";
import Link from "next/link";
import { loadPosts, loadSiteConfig } from "@/lib/content";
import { deriveExcerpt, formatPostDate } from "@/lib/posts";
import { buildCanonicalUrl } from "@/lib/seo";

export function generateMetadata(): Metadata {
  const { meta } = loadSiteConfig();
  return {
    title: `Blogi — ${meta.name}`,
    alternates: { canonical: buildCanonicalUrl(meta.url, "/blog") },
  };
}

export default function BlogIndexPage() {
  const posts = loadPosts();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <Link href="/" className="text-sm text-gray-500 hover:underline">
          ← Etusivulle
        </Link>
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-gray-900">
          Blogi
        </h1>

        <div className="mt-10 space-y-10">
          {posts.length === 0 ? (
            <p className="text-gray-500">Ei vielä julkaistuja kirjoituksia.</p>
          ) : (
            posts.map((post) => (
              <article key={post.id}>
                {post.publishedAt && (
                  <time
                    dateTime={post.publishedAt}
                    className="text-sm text-gray-500"
                  >
                    {formatPostDate(post.publishedAt)}
                  </time>
                )}
                <h2 className="mt-1 text-2xl font-semibold text-gray-900">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-2 text-gray-600">
                  {post.excerpt || deriveExcerpt(post.content)}
                </p>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
