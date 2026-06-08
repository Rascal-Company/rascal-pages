import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { loadPostBySlug, loadPosts, loadSiteConfig } from "@/lib/content";
import { deriveExcerpt, formatPostDate, splitParagraphs } from "@/lib/posts";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";

type BlogPostProps = {
  params: Promise<{ slug: string }>;
};

/** Pre-render a static page for every published post. */
export function generateStaticParams() {
  return loadPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: BlogPostProps): Promise<Metadata> {
  const { slug } = await params;
  const post = loadPostBySlug(slug);
  if (!post) return {};

  const { meta } = loadSiteConfig();
  const canonical = buildCanonicalUrl(meta.url, `/blog/${post.slug}`);
  const title = post.seoTitle || post.title;
  const description =
    post.seoDescription || post.excerpt || deriveExcerpt(post.content);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "article",
      title,
      description,
      url: canonical,
      images: post.coverImage ? [post.coverImage] : undefined,
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt,
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostProps) {
  const { slug } = await params;
  const post = loadPostBySlug(slug);
  if (!post) notFound();

  const { meta } = loadSiteConfig();
  const canonical = buildCanonicalUrl(meta.url, `/blog/${post.slug}`);
  const description =
    post.seoDescription || post.excerpt || deriveExcerpt(post.content);

  const articleJsonLd = buildArticleJsonLd({
    title: post.seoTitle || post.title,
    description,
    url: canonical,
    image: post.coverImage ?? undefined,
    authorName: meta.name,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
  });

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Etusivu", url: buildCanonicalUrl(meta.url, "/") },
    { name: "Blogi", url: buildCanonicalUrl(meta.url, "/blog") },
    { name: post.title, url: canonical },
  ]);

  const paragraphs = splitParagraphs(post.content);

  return (
    <div className="min-h-screen bg-white">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumb} />
      <article className="mx-auto max-w-2xl px-6 py-16 lg:px-8">
        <Link href="/blog" className="text-sm text-gray-500 hover:underline">
          ← Blogiin
        </Link>

        {post.publishedAt && (
          <time
            dateTime={post.publishedAt}
            className="mt-6 block text-sm text-gray-500"
          >
            {formatPostDate(post.publishedAt)}
          </time>
        )}
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">
          {post.title}
        </h1>

        {post.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImage}
            alt={post.title}
            className="mt-8 w-full rounded-2xl object-cover"
          />
        )}

        <div className="mt-8 space-y-6 text-lg leading-8 text-gray-700">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
