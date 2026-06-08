/**
 * Blog post domain model and pure helpers.
 * Posts are stored per-site and power the personal-brand blog.
 */

import type { Brand } from "./types";

export type PostId = Brand<string, "PostId">;

export function createPostId(id: string): PostId {
  return id as PostId;
}

export type Post = {
  id: PostId;
  siteId: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  published: boolean;
  publishedAt: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  updatedAt: string;
};

/**
 * Raw database row shape (snake_case) for the `posts` table.
 */
export type PostRow = {
  id: string;
  site_id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  published: boolean;
  published_at: string | null;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export function mapPostRow(row: PostRow): Post {
  return {
    id: createPostId(row.id),
    siteId: row.site_id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    content: row.content,
    coverImage: row.cover_image,
    published: row.published,
    publishedAt: row.published_at,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert a title into a URL-safe slug, transliterating Finnish characters.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[äå]/g, "a")
    .replace(/ö/g, "o")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Derive a short excerpt from post content, breaking on a word boundary.
 */
export function deriveExcerpt(content: string, maxLength = 160): string {
  const text = content.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) return text;

  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  const base = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return `${base}…`;
}

/**
 * Split plain-text/markdown content into paragraphs on blank lines.
 */
export function splitParagraphs(content: string): string[] {
  return content
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

/**
 * Sort posts newest-first by publish date, falling back to creation date.
 */
export function sortPostsByPublishedAt(posts: Post[]): Post[] {
  return [...posts].sort((a, b) => {
    const aTime = new Date(a.publishedAt ?? a.createdAt).getTime();
    const bTime = new Date(b.publishedAt ?? b.createdAt).getTime();
    return bTime - aTime;
  });
}

/**
 * Format an ISO date for display. Returns empty string for missing/invalid dates.
 */
export function formatPostDate(iso: string | null, locale = "fi-FI"): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}
