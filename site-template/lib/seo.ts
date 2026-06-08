/**
 * Pure SEO helpers: canonical URLs and JSON-LD structured data builders.
 * Ported verbatim from the Rascal Pages app (src/lib/seo.ts).
 */

export function buildCanonicalUrl(baseUrl: string, path: string): string {
  const cleanBase = baseUrl.replace(/\/+$/, "");
  const cleanPath =
    path === "/" || path === "" ? "" : `/${path.replace(/^\/+/, "")}`;
  return `${cleanBase}${cleanPath}`;
}

export type PersonJsonLdInput = {
  name: string;
  description?: string;
  url: string;
  image?: string;
  sameAs?: string[];
};

export function buildPersonJsonLd(
  input: PersonJsonLdInput,
): Record<string, unknown> {
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

export function buildArticleJsonLd(
  input: ArticleJsonLdInput,
): Record<string, unknown> {
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

export function buildBreadcrumbJsonLd(
  items: BreadcrumbItem[],
): Record<string, unknown> {
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
