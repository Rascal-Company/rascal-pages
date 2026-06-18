import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteRenderer from "@/app/components/renderer/SiteRenderer";
import { createSiteId } from "@/src/lib/types";
import ThirdPartyScripts from "@/app/components/analytics/ThirdPartyScripts";
import {
  getPublishedPageBySlug,
  getPublishedPosts,
  getRequestBaseUrl,
  getSiteByDomain,
  getSiteChrome,
} from "@/src/lib/site-queries";
import { migrateToSections } from "@/app/components/editor/utils/contentUtils";
import { buildCanonicalUrl, resolvePageSeo } from "@/src/lib/seo";

// Estetään pre-rendering build-aikana, koska sivu vaatii runtime-tietokantakutsuja
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ domain: string; slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { domain, slug } = await params;
  const site = await getSiteByDomain(domain);
  if (!site) return {};

  const page = await getPublishedPageBySlug(site.id, slug);
  if (!page) return {};

  const normalized = migrateToSections(page.content);
  const baseUrl = await getRequestBaseUrl();
  const canonical = buildCanonicalUrl(baseUrl, `/${slug}`);
  const seo = resolvePageSeo(normalized.seo, {
    title: page.title || domain,
    description: "",
  });

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: seo.title,
      description: seo.description,
      url: canonical,
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
  };
}

export default async function SubPage({ params }: PageProps) {
  const { domain, slug } = await params;
  const site = await getSiteByDomain(domain);
  if (!site) notFound();

  const page = await getPublishedPageBySlug(site.id, slug);
  if (!page) notFound();

  const [posts, chrome] = await Promise.all([
    getPublishedPosts(site.id),
    getSiteChrome(site.id),
  ]);

  const settings = (site.settings as Record<string, unknown>) || {};
  const gtmId = settings.googleTagManagerId as string | undefined;
  const ga4Id = settings.googleAnalyticsId as string | undefined;
  const metaPixelId = settings.metaPixelId as string | undefined;

  return (
    <>
      <ThirdPartyScripts gtmId={gtmId} ga4Id={ga4Id} metaPixelId={metaPixelId} />
      <SiteRenderer
        content={page.content}
        siteId={createSiteId(site.id)}
        posts={posts}
        siteNav={chrome.navLinks}
        siteBrand={chrome.brand}
        currentPath={`/${slug}`}
      />
    </>
  );
}
