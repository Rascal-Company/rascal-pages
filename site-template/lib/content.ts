/**
 * Content loader — the heart of the git-native model.
 *
 * Reads the site's content from local files instead of a database:
 *   - `content/site.json`   → site meta + TemplateConfig (sections + theme)
 *   - `content/posts/*.md`  → blog posts (flat frontmatter + markdown body)
 *
 * The pure parsing functions (`parseFrontmatter`, `frontmatterToPost`) are
 * separated from the filesystem reads so they can be unit-tested without I/O.
 */

import fs from "node:fs";
import path from "node:path";
import type { TemplateConfig } from "./templates";
import { PERSONAL_BRAND_FALLBACK } from "./templates";
import type { Post } from "./posts";
import {
  createPostId,
  deriveExcerpt,
  slugify,
  sortPostsByPublishedAt,
} from "./posts";

export type SiteMeta = {
  subdomain: string;
  customDomain?: string;
  name: string;
  url: string;
};

export type SiteConfig = {
  meta: SiteMeta;
  template: TemplateConfig;
};

const DEFAULT_CONTENT_DIR = path.join(process.cwd(), "content");

/**
 * Split a markdown file into its flat frontmatter map and body.
 *
 * Frontmatter is intentionally a flat `key: value` block (no nested YAML) to
 * keep parsing dependency-free and predictable — this is the locked v1 schema.
 * Surrounding quotes on values are stripped. Files without a frontmatter block
 * yield an empty map and the whole input as the body.
 */
export function parseFrontmatter(raw: string): {
  data: Record<string, string>;
  body: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(raw);
  if (!match) return { data: {}, body: raw.trim() };

  const [, frontmatter, body] = match;
  const data: Record<string, string> = {};

  for (const line of frontmatter.split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    if (key.length === 0) continue;
    const value = line
      .slice(separator + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    data[key] = value;
  }

  return { data, body: body.trim() };
}

/**
 * Map a parsed frontmatter map + body into a Post. Missing fields fall back to
 * sensible defaults: slug derives from the title, excerpt from the body, and a
 * post is only `published` when the frontmatter explicitly says `true`.
 */
export function frontmatterToPost(
  data: Record<string, string>,
  body: string,
): Post {
  const title = data.title && data.title.length > 0 ? data.title : "Untitled";
  const slug = data.slug && data.slug.length > 0 ? data.slug : slugify(title);

  const parsedDate = data.date ? new Date(data.date) : null;
  const publishedAt =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate.toISOString()
      : null;

  return {
    id: createPostId(slug),
    slug,
    title,
    excerpt:
      data.excerpt && data.excerpt.length > 0
        ? data.excerpt
        : deriveExcerpt(body),
    content: body,
    coverImage:
      data.coverImage && data.coverImage.length > 0 ? data.coverImage : null,
    published: data.published === "true",
    publishedAt,
    seoTitle: data.seoTitle && data.seoTitle.length > 0 ? data.seoTitle : null,
    seoDescription:
      data.seoDescription && data.seoDescription.length > 0
        ? data.seoDescription
        : null,
    updatedAt: publishedAt ?? new Date(0).toISOString(),
  };
}

/**
 * Load and parse every markdown file under the posts directory, returning only
 * published posts sorted newest-first.
 */
export function loadPosts(contentDir = DEFAULT_CONTENT_DIR): Post[] {
  const postsDir = path.join(contentDir, "posts");
  if (!fs.existsSync(postsDir)) return [];

  const posts = fs
    .readdirSync(postsDir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(postsDir, file), "utf8");
      const { data, body } = parseFrontmatter(raw);
      return frontmatterToPost(data, body);
    })
    .filter((post) => post.published);

  return sortPostsByPublishedAt(posts);
}

/**
 * Find a single published post by slug, or null if none matches.
 */
export function loadPostBySlug(
  slug: string,
  contentDir = DEFAULT_CONTENT_DIR,
): Post | null {
  return loadPosts(contentDir).find((post) => post.slug === slug) ?? null;
}

/**
 * Load the site config (meta + TemplateConfig). Falls back to the personal-brand
 * template when `content/site.json` is absent.
 */
export function loadSiteConfig(contentDir = DEFAULT_CONTENT_DIR): SiteConfig {
  const configPath = path.join(contentDir, "site.json");

  if (!fs.existsSync(configPath)) {
    return {
      meta: { subdomain: "", name: "", url: "" },
      template: PERSONAL_BRAND_FALLBACK,
    };
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8")) as {
    subdomain?: string;
    customDomain?: string;
    site?: { name?: string; url?: string };
    templateId?: string;
    theme?: TemplateConfig["theme"];
    sections?: TemplateConfig["sections"];
  };

  return {
    meta: {
      subdomain: parsed.subdomain ?? "",
      customDomain: parsed.customDomain,
      name: parsed.site?.name ?? "",
      url: parsed.site?.url ?? "",
    },
    template: {
      templateId: parsed.templateId ?? PERSONAL_BRAND_FALLBACK.templateId,
      theme: parsed.theme ?? PERSONAL_BRAND_FALLBACK.theme,
      sections: parsed.sections ?? PERSONAL_BRAND_FALLBACK.sections,
    },
  };
}
