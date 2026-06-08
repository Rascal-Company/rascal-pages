import { describe, expect, test } from "vitest";
import {
  deriveExcerpt,
  formatPostDate,
  mapPostRow,
  slugify,
  sortPostsByPublishedAt,
  splitParagraphs,
  type Post,
  type PostRow,
} from "./posts";

describe(slugify, () => {
  test("lowercases and hyphenates words", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  test("transliterates Finnish characters", () => {
    expect(slugify("Älä Ölise Åland")).toBe("ala-olise-aland");
  });

  test("strips leading/trailing and collapses separators", () => {
    expect(slugify("  Hello --- World!!  ")).toBe("hello-world");
  });

  test("removes accents from latin characters", () => {
    expect(slugify("Café résumé")).toBe("cafe-resume");
  });
});

describe(deriveExcerpt, () => {
  test("returns the full text when shorter than the limit", () => {
    expect(deriveExcerpt("Short text", 160)).toBe("Short text");
  });

  test("collapses internal whitespace", () => {
    expect(deriveExcerpt("a\n\n  b   c", 160)).toBe("a b c");
  });

  test("truncates on a word boundary and appends an ellipsis", () => {
    const text = "one two three four five";
    expect(deriveExcerpt(text, 12)).toBe("one two…");
  });
});

describe(splitParagraphs, () => {
  test("splits on blank lines and trims each paragraph", () => {
    expect(splitParagraphs("First.\n\n  Second.  \n\nThird.")).toEqual([
      "First.",
      "Second.",
      "Third.",
    ]);
  });

  test("drops empty paragraphs", () => {
    expect(splitParagraphs("Only.\n\n\n\n")).toEqual(["Only."]);
  });
});

describe(sortPostsByPublishedAt, () => {
  const makePost = (id: string, publishedAt: string | null, createdAt: string): Post => ({
    id: id as Post["id"],
    siteId: "site-1",
    slug: id,
    title: id,
    excerpt: null,
    content: "",
    coverImage: null,
    published: true,
    publishedAt,
    seoTitle: null,
    seoDescription: null,
    createdAt,
    updatedAt: createdAt,
  });

  test("orders posts newest-first by publishedAt", () => {
    const older = makePost("older", "2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z");
    const newer = makePost("newer", "2024-06-01T00:00:00Z", "2024-06-01T00:00:00Z");
    expect(sortPostsByPublishedAt([older, newer]).map((p) => p.slug)).toEqual([
      "newer",
      "older",
    ]);
  });

  test("falls back to createdAt when publishedAt is null", () => {
    const withDate = makePost("dated", "2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z");
    const draftish = makePost("created", null, "2024-12-01T00:00:00Z");
    expect(sortPostsByPublishedAt([withDate, draftish]).map((p) => p.slug)).toEqual([
      "created",
      "dated",
    ]);
  });

  test("does not mutate the input array", () => {
    const a = makePost("a", "2024-01-01T00:00:00Z", "2024-01-01T00:00:00Z");
    const b = makePost("b", "2024-06-01T00:00:00Z", "2024-06-01T00:00:00Z");
    const input = [a, b];
    sortPostsByPublishedAt(input);
    expect(input.map((p) => p.slug)).toEqual(["a", "b"]);
  });
});

describe(formatPostDate, () => {
  test("formats an ISO date in the given locale", () => {
    expect(formatPostDate("2024-06-08T00:00:00Z", "en-US")).toBe("June 8, 2024");
  });

  test("returns empty string for null", () => {
    expect(formatPostDate(null)).toBe("");
  });

  test("returns empty string for an invalid date", () => {
    expect(formatPostDate("not-a-date")).toBe("");
  });
});

describe(mapPostRow, () => {
  test("maps snake_case row to camelCase post", () => {
    const row: PostRow = {
      id: "11111111-1111-1111-1111-111111111111",
      site_id: "22222222-2222-2222-2222-222222222222",
      slug: "my-post",
      title: "My Post",
      excerpt: "Excerpt",
      content: "Body",
      cover_image: "https://example.com/cover.jpg",
      published: true,
      published_at: "2024-06-08T00:00:00Z",
      seo_title: "SEO Title",
      seo_description: "SEO Description",
      created_at: "2024-06-01T00:00:00Z",
      updated_at: "2024-06-02T00:00:00Z",
    };

    expect(mapPostRow(row)).toEqual({
      id: "11111111-1111-1111-1111-111111111111",
      siteId: "22222222-2222-2222-2222-222222222222",
      slug: "my-post",
      title: "My Post",
      excerpt: "Excerpt",
      content: "Body",
      coverImage: "https://example.com/cover.jpg",
      published: true,
      publishedAt: "2024-06-08T00:00:00Z",
      seoTitle: "SEO Title",
      seoDescription: "SEO Description",
      createdAt: "2024-06-01T00:00:00Z",
      updatedAt: "2024-06-02T00:00:00Z",
    });
  });
});
