import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPostBySlug,
  getRequestBaseUrl,
  getSiteByDomain,
} from "@/src/lib/site-queries";
import { deriveExcerpt, formatPostDate } from "@/src/lib/posts";
import MarkdownContent from "@/app/components/MarkdownContent";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
} from "@/src/lib/seo";
import JsonLd from "@/app/components/JsonLd";

export const dynamic = "force-dynamic";

type BlogPostProps = {
  params: Promise<{ domain: string; slug: string }>;
};

export async function generateMetadata({
  params,
}: BlogPostProps): Promise<Metadata> {
  const { domain, slug } = await params;
  const site = await getSiteByDomain(domain);
  if (!site) return {};

  const post = await getPostBySlug(site.id, slug);
  if (!post) return {};

  const baseUrl = await getRequestBaseUrl();
  const canonical = buildCanonicalUrl(baseUrl, `/blog/${post.slug}`);
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
  const { domain, slug } = await params;
  const site = await getSiteByDomain(domain);
  if (!site) notFound();

  const post = await getPostBySlug(site.id, slug);
  if (!post) notFound();

  const baseUrl = await getRequestBaseUrl();
  const canonical = buildCanonicalUrl(baseUrl, `/blog/${post.slug}`);
  const description =
    post.seoDescription || post.excerpt || deriveExcerpt(post.content);

  const articleJsonLd = buildArticleJsonLd({
    title: post.seoTitle || post.title,
    description,
    url: canonical,
    image: post.coverImage ?? undefined,
    authorName: domain,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
  });

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Etusivu", url: buildCanonicalUrl(baseUrl, "/") },
    { name: "Blogi", url: buildCanonicalUrl(baseUrl, "/blog") },
    { name: post.title, url: canonical },
  ]);

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

        <div className="mt-8">
          <MarkdownContent content={post.content} />
        </div>
      </article>
    </div>
  );
}
