/**
 * Pure SEO helpers: canonical URLs and JSON-LD structured data builders.
 */

import type { SeoConfig } from "./templates";

export type ResolvedPageSeo = {
  title: string;
  description: string | undefined;
  ogImage: string | undefined;
};

/**
 * Resolve the final SEO metadata for a published page. Explicit per-page SEO
 * overrides win; blank or whitespace-only values fall back to the title and
 * description derived from the page content.
 */
export function resolvePageSeo(
  seo: SeoConfig | undefined,
  fallback: { title: string; description: string },
): ResolvedPageSeo {
  const metaTitle = seo?.metaTitle?.trim();
  const metaDescription = seo?.metaDescription?.trim();
  const ogImage = seo?.ogImage?.trim();
  const description = metaDescription || fallback.description.trim();

  return {
    title: metaTitle || fallback.title,
    description: description || undefined,
    ogImage: ogImage || undefined,
  };
}

export function buildCanonicalUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath = path === "/" || path === "" ? "" : `/${path.replace(/^\/+/, "")}`;
  return `${cleanBase}${cleanPath}`;
}

export type PersonJsonLdInput = {
  name: string;
  description?: string;
  url: string;
  image?: string;
  sameAs?: string[];
};

export function buildPersonJsonLd(input: PersonJsonLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    ...(input.image ? { image: input.image } : {}),
    ...(input.sameAs && input.sameAs.length > 0 ? { sameAs: input.sameAs } : {}),
  };
}

export type ArticleJsonLdInput = {
  title: string;
  description?: string;
  url: string;
  image?: string;
  authorName: string;
  datePublished?: string;
  dateModified?: string;
};

export function buildArticleJsonLd(input: ArticleJsonLdInput): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.title,
    ...(input.description ? { description: input.description } : {}),
    url: input.url,
    ...(input.image ? { image: input.image } : {}),
    author: { "@type": "Person", name: input.authorName },
    ...(input.datePublished ? { datePublished: input.datePublished } : {}),
    ...(input.dateModified ? { dateModified: input.dateModified } : {}),
  };
}

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
