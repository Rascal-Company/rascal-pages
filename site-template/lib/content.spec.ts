import { describe, expect, test } from "vitest";
import path from "node:path";
import {
  frontmatterToPost,
  loadPosts,
  loadPostBySlug,
  loadSiteConfig,
  parseFrontmatter,
} from "./content";
import { deriveExcerpt, slugify } from "./posts";

const EXAMPLE_CONTENT_DIR = path.join(__dirname, "..", "content");

describe("parseFrontmatter", () => {
  test("splits a flat key:value block from the body", () => {
    const raw = "---\ntitle: Hello\nslug: hello\n---\nBody line one.";

    expect(parseFrontmatter(raw)).toEqual({
      data: { title: "Hello", slug: "hello" },
      body: "Body line one.",
    });
  });

  test("strips surrounding quotes from values", () => {
    const raw = `---\ntitle: "Quoted Title"\nexcerpt: 'single'\n---\nx`;

    expect(parseFrontmatter(raw).data).toEqual({
      title: "Quoted Title",
      excerpt: "single",
    });
  });

  test("returns empty data and the full input as body when no frontmatter", () => {
    const raw = "Just a body with no frontmatter.";

    expect(parseFrontmatter(raw)).toEqual({ data: {}, body: raw });
  });

  test("handles CRLF line endings", () => {
    const raw = "---\r\ntitle: Win\r\n---\r\nBody";

    expect(parseFrontmatter(raw)).toEqual({
      data: { title: "Win" },
      body: "Body",
    });
  });
});

describe("frontmatterToPost", () => {
  const body = "First paragraph of the post body.";

  test("derives slug from title when slug is absent", () => {
    const post = frontmatterToPost({ title: "Hello Wörld" }, body);

    expect(post.slug).toBe(slugify("Hello Wörld"));
  });

  test("respects an explicit slug over the title", () => {
    const post = frontmatterToPost({ title: "Hello", slug: "custom" }, body);

    expect(post.slug).toBe("custom");
  });

  test("is published only when frontmatter says exactly 'true'", () => {
    expect(frontmatterToPost({ title: "a", published: "true" }, body).published).toBe(true);
    expect(frontmatterToPost({ title: "a", published: "false" }, body).published).toBe(false);
    expect(frontmatterToPost({ title: "a" }, body).published).toBe(false);
  });

  test("falls back to a derived excerpt when none is given", () => {
    const post = frontmatterToPost({ title: "a" }, body);

    expect(post.excerpt).toBe(deriveExcerpt(body));
  });

  test("parses a valid date into an ISO publishedAt", () => {
    const post = frontmatterToPost({ title: "a", date: "2026-05-20" }, body);

    expect(post.publishedAt).toBe(new Date("2026-05-20").toISOString());
  });
});

describe("loadPosts", () => {
  test("returns only published posts, newest first", () => {
    const posts = loadPosts(EXAMPLE_CONTENT_DIR);

    expect(posts.map((p) => p.slug)).toEqual([
      "obsidian-julkaisu",
      "git-native-sivu",
    ]);
  });
});

describe("loadPostBySlug", () => {
  test("finds a published post by slug", () => {
    const post = loadPostBySlug("git-native-sivu", EXAMPLE_CONTENT_DIR);

    expect(post?.title).toBe("Miksi sivustosi kuuluu Gitiin");
  });

  test("returns null for an unpublished slug", () => {
    expect(loadPostBySlug("tuleva-kirjoitus", EXAMPLE_CONTENT_DIR)).toBeNull();
  });
});

describe("loadSiteConfig", () => {
  test("reads meta and template config from site.json", () => {
    const config = loadSiteConfig(EXAMPLE_CONTENT_DIR);

    expect(config.meta).toEqual({
      subdomain: "samikiias",
      customDomain: "samikiias.fi",
      name: "Sami Kiias",
      url: "https://samikiias.fi",
    });
    expect(config.template.templateId).toBe("personal-brand");
    expect(config.template.sections.map((s) => s.type)).toEqual([
      "hero",
      "about",
      "blog",
      "footer",
    ]);
  });
});
