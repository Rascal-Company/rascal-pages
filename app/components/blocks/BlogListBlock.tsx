import Link from "next/link";
import type { SiteId } from "@/src/lib/types";
import type { BlogContent } from "@/src/lib/templates";
import type { Post } from "@/src/lib/posts";
import { deriveExcerpt, formatPostDate } from "@/src/lib/posts";
import { surfaceTokens } from "./appearance";

type BlogListBlockProps = {
  content: BlogContent;
  posts?: Post[];
  theme: { primaryColor: string; appearance?: "light" | "dark" };
  siteId: SiteId;
  isPreview?: boolean;
  templateId?: string;
};

export default function BlogListBlock({
  content,
  posts,
  theme,
  isPreview = false,
  templateId,
}: BlogListBlockProps) {
  const primaryColor = theme.primaryColor || "#0EA5E9";
  const t = surfaceTokens(theme, templateId);
  const visiblePosts = (posts ?? []).slice(0, content.postsToShow);

  // Hide the section entirely on the published site when there are no posts yet,
  // so a freshly generated portfolio doesn't show an empty placeholder. In the
  // editor preview we keep it visible with a hint.
  if (!isPreview && visiblePosts.length === 0) return null;

  return (
    <section id="blogi" className={t.sectionAlt}>
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2
            className={`text-3xl font-bold tracking-tight sm:text-4xl ${t.heading}`}
            style={{ fontFamily: "var(--heading-font, inherit)" }}
          >
            {content.heading}
          </h2>
          {content.subheading && (
            <p
              className={`mt-4 text-lg ${t.body}`}
              style={{ fontFamily: "var(--body-font, inherit)" }}
            >
              {content.subheading}
            </p>
          )}
        </div>

        {visiblePosts.length === 0 ? (
          <p className={`mt-12 text-center ${t.muted}`}>
            {isPreview
              ? "Blogikirjoitukset näkyvät tässä, kun niitä on julkaistu."
              : "Ei vielä julkaistuja kirjoituksia."}
          </p>
        ) : (
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {visiblePosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className={`group flex flex-col overflow-hidden rounded-2xl shadow-sm transition-transform duration-200 hover:-translate-y-1 ${t.card}`}
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
                      className={`text-sm ${t.muted}`}
                    >
                      {formatPostDate(post.publishedAt)}
                    </time>
                  )}
                  <h3
                    className={`mt-2 text-xl font-semibold ${t.heading}`}
                    style={{ fontFamily: "var(--heading-font, inherit)" }}
                  >
                    {post.title}
                  </h3>
                  <p className={`mt-3 flex-1 ${t.body}`}>
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
