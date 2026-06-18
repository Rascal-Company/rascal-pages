import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPublishedPosts,
  getRequestBaseUrl,
  getSiteByDomain,
  getSiteChrome,
} from "@/src/lib/site-queries";
import { deriveExcerpt, formatPostDate } from "@/src/lib/posts";
import { buildBreadcrumbJsonLd, buildCanonicalUrl } from "@/src/lib/seo";
import JsonLd from "@/app/components/JsonLd";
import SiteThemeRoot from "@/app/components/site/SiteThemeRoot";
import SiteHeader from "@/app/components/site/SiteHeader";
import { FooterBlock } from "@/app/components/blocks";
import { createSiteId } from "@/src/lib/types";

export const dynamic = "force-dynamic";

type BlogIndexProps = {
  params: Promise<{ domain: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = await getRequestBaseUrl();
  const canonical = buildCanonicalUrl(baseUrl, "/blog");

  return {
    title: "Blogi",
    description: "Uusimmat kirjoitukset ja ajatukset.",
    alternates: { canonical },
    openGraph: { type: "website", title: "Blogi", url: canonical },
  };
}

export default async function BlogIndexPage({ params }: BlogIndexProps) {
  const { domain } = await params;
  const site = await getSiteByDomain(domain);

  if (!site) notFound();

  const [posts, chrome, baseUrl] = await Promise.all([
    getPublishedPosts(site.id),
    getSiteChrome(site.id),
    getRequestBaseUrl(),
  ]);

  const breadcrumb = buildBreadcrumbJsonLd([
    { name: "Etusivu", url: buildCanonicalUrl(baseUrl, "/") },
    { name: "Blogi", url: buildCanonicalUrl(baseUrl, "/blog") },
  ]);

  return (
    <SiteThemeRoot theme={chrome.theme} templateId={chrome.templateId}>
      <JsonLd data={breadcrumb} />
      {chrome.showNav && (
        <SiteHeader
          brand={chrome.brand}
          links={chrome.navLinks}
          theme={chrome.theme}
          currentPath="/blog"
        />
      )}
      <div className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        {!chrome.showNav && (
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Etusivulle
          </Link>
        )}
        <h1 className="mt-6 text-4xl font-bold tracking-tight text-foreground">
          Blogi
        </h1>

        {posts.length === 0 ? (
          <p className="mt-10 text-muted-foreground">
            Ei vielä julkaistuja kirjoituksia.
          </p>
        ) : (
          <ul className="mt-10 space-y-10">
            {posts.map((post) => (
              <li
                key={post.id}
                className="border-b border-border pb-10 last:border-0"
              >
                {post.publishedAt && (
                  <time
                    dateTime={post.publishedAt}
                    className="text-sm text-muted-foreground"
                  >
                    {formatPostDate(post.publishedAt)}
                  </time>
                )}
                <h2 className="mt-1 text-2xl font-semibold text-foreground">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </h2>
                <p className="mt-3 text-muted-foreground">
                  {post.excerpt || deriveExcerpt(post.content)}
                </p>
                <Link
                  href={`/blog/${post.slug}`}
                  className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
                >
                  Lue lisää →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      <FooterBlock
        content={null}
        theme={chrome.theme}
        siteId={createSiteId(site.id)}
        templateId={chrome.templateId}
      />
    </SiteThemeRoot>
  );
}
