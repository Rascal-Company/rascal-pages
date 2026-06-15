import { describe, expect, test } from "vitest";
import {
  buildArticleJsonLd,
  buildBreadcrumbJsonLd,
  buildCanonicalUrl,
  buildPersonJsonLd,
  resolvePageSeo,
} from "./seo";

describe(resolvePageSeo, () => {
  const fallback = {
    title: "Sami Kiias",
    description: "Markkinoinnin asiantuntija",
  };

  test("prefers explicit per-page SEO over the content fallback", () => {
    expect(
      resolvePageSeo(
        {
          metaTitle: "Oma otsikko",
          metaDescription: "Oma kuvaus hakukoneille",
          ogImage: "https://example.fi/og.png",
        },
        fallback,
      ),
    ).toEqual({
      title: "Oma otsikko",
      description: "Oma kuvaus hakukoneille",
      ogImage: "https://example.fi/og.png",
    });
  });

  test("falls back to content-derived values when SEO is unset", () => {
    expect(resolvePageSeo(undefined, fallback)).toEqual({
      title: "Sami Kiias",
      description: "Markkinoinnin asiantuntija",
      ogImage: undefined,
    });
  });

  test("treats whitespace-only overrides as empty and falls back", () => {
    expect(
      resolvePageSeo(
        { metaTitle: "   ", metaDescription: "  ", ogImage: " " },
        fallback,
      ),
    ).toEqual({
      title: "Sami Kiias",
      description: "Markkinoinnin asiantuntija",
      ogImage: undefined,
    });
  });

  test("returns undefined description when both override and fallback are blank", () => {
    expect(
      resolvePageSeo(undefined, { title: "esimerkki.fi", description: "" }),
    ).toEqual({
      title: "esimerkki.fi",
      description: undefined,
      ogImage: undefined,
    });
  });

  test("allows description override while title falls back", () => {
    expect(
      resolvePageSeo({ metaDescription: "Vain kuvaus" }, fallback),
    ).toEqual({
      title: "Sami Kiias",
      description: "Vain kuvaus",
      ogImage: undefined,
    });
  });
});

describe(buildCanonicalUrl, () => {
  test("joins base and path with a single slash", () => {
    expect(buildCanonicalUrl("https://samikiias.fi", "blog/my-post")).toBe(
      "https://samikiias.fi/blog/my-post",
    );
  });

  test("normalizes trailing and leading slashes", () => {
    expect(buildCanonicalUrl("https://samikiias.fi/", "/blog")).toBe(
      "https://samikiias.fi/blog",
    );
  });

  test("returns the bare base for the root path", () => {
    expect(buildCanonicalUrl("https://samikiias.fi", "/")).toBe(
      "https://samikiias.fi",
    );
  });
});

describe(buildPersonJsonLd, () => {
  test("includes required fields and omits empty optionals", () => {
    expect(
      buildPersonJsonLd({ name: "Sami Kiias", url: "https://samikiias.fi" }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Sami Kiias",
      url: "https://samikiias.fi",
    });
  });

  test("includes optional fields when provided", () => {
    expect(
      buildPersonJsonLd({
        name: "Sami Kiias",
        url: "https://samikiias.fi",
        description: "Markkinoinnin asiantuntija",
        image: "https://samikiias.fi/me.jpg",
        sameAs: ["https://www.linkedin.com/in/sami"],
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Person",
      name: "Sami Kiias",
      description: "Markkinoinnin asiantuntija",
      url: "https://samikiias.fi",
      image: "https://samikiias.fi/me.jpg",
      sameAs: ["https://www.linkedin.com/in/sami"],
    });
  });
});

describe(buildArticleJsonLd, () => {
  test("builds an Article with a nested Person author", () => {
    expect(
      buildArticleJsonLd({
        title: "SEO 101",
        url: "https://samikiias.fi/blog/seo-101",
        authorName: "Sami Kiias",
        datePublished: "2024-06-08T00:00:00Z",
      }),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: "SEO 101",
      url: "https://samikiias.fi/blog/seo-101",
      author: { "@type": "Person", name: "Sami Kiias" },
      datePublished: "2024-06-08T00:00:00Z",
    });
  });
});

describe(buildBreadcrumbJsonLd, () => {
  test("assigns 1-based positions in order", () => {
    expect(
      buildBreadcrumbJsonLd([
        { name: "Etusivu", url: "https://samikiias.fi" },
        { name: "Blogi", url: "https://samikiias.fi/blog" },
      ]),
    ).toEqual({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Etusivu",
          item: "https://samikiias.fi",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blogi",
          item: "https://samikiias.fi/blog",
        },
      ],
    });
  });
});
