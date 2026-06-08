import Link from "next/link";
import type { BlogContent, ThemeConfig } from "@/lib/templates";
import type { Post } from "@/lib/posts";
import { deriveExcerpt, formatPostDate } from "@/lib/posts";

/**
 * Blog listing section. Ported from the app; posts now come from markdown.
 */
export default function BlogListBlock({
  content,
  posts,
  theme,
}: {
  content: BlogContent;
  posts: Post[];
  theme: ThemeConfig;
}) {
  const primaryColor = theme.primaryColor || "#0EA5E9";
  const visiblePosts = posts.slice(0, content.postsToShow);

  return (
    <section id="blogi" className="bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            {content.heading}
          </h2>
          {content.subheading && (
            <p
              className="mt-4 text-lg text-gray-600"
              style={{ fontFamily: "var(--body-font, inherit)" }}
            >
              {content.subheading}
            </p>
          )}
        </div>

        {visiblePosts.length === 0 ? (
          <p className="mt-12 text-center text-gray-500">
            Ei vielä julkaistuja kirjoituksia.
          </p>
        ) : (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200 transition-shadow hover:shadow-md"
              >
                {post.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="h-48 w-full object-cover"
                  />
                )}
                <div className="flex flex-1 flex-col p-6">
                  {post.publishedAt && (
                    <time
                      dateTime={post.publishedAt}
                      className="text-sm text-gray-500"
                    >
                      {formatPostDate(post.publishedAt)}
                    </time>
                  )}
                  <h3
                    className="mt-2 text-xl font-semibold text-gray-900"
                    style={{ fontFamily: "var(--heading-font, inherit)" }}
                  >
                    {post.title}
                  </h3>
                  <p className="mt-3 flex-1 text-gray-600">
                    {post.excerpt || deriveExcerpt(post.content)}
                  </p>
                  <span
                    className="mt-4 text-sm font-semibold group-hover:underline"
                    style={{ color: primaryColor }}
                  >
                    Lue lisää →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
