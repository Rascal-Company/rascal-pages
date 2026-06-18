import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPostBySlug,
  getRequestBaseUrl,
  getSiteByDomain,
  getSiteChrome,
} from "@/src/lib/site-queries";
import { deriveExcerpt, formatPostDate } from "@/src/lib/posts";
import MarkdownContent from "@/app/components/MarkdownContent";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
} from "@/src/lib/seo";
import JsonLd from "@/app/components/JsonLd";
import SiteThemeRoot from "@/app/components/site/SiteThemeRoot";
import SiteHeader from "@/app/components/site/SiteHeader";
import { FooterBlock } from "@/app/components/blocks";
import { createSiteId } from "@/src/lib/types";

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

  const [chrome, baseUrl] = await Promise.all([
    getSiteChrome(site.id),
    getRequestBaseUrl(),
  ]);
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
    <SiteThemeRoot theme={chrome.theme} templateId={chrome.templateId}>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumb} />
      {chrome.showNav && (
        <SiteHeader
          brand={chrome.brand}
          links={chrome.navLinks}
          theme={chrome.theme}
          currentPath="/blog"
        />
      )}
      <article className="mx-auto max-w-2xl px-6 py-16 lg:px-8">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Blogiin
        </Link>

        {post.publishedAt && (
          <time
            dateTime={post.publishedAt}
            className="mt-6 block text-sm text-muted-foreground"
          >
            {formatPostDate(post.publishedAt)}
          </time>
        )}
        <h1 className="mt-2 text-4xl font-bold tracking-tight text-foreground">
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
      <FooterBlock
        content={null}
        theme={chrome.theme}
        siteId={createSiteId(site.id)}
        templateId={chrome.templateId}
      />
    </SiteThemeRoot>
  );
}
