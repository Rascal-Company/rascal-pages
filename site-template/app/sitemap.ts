import type { MetadataRoute } from "next";
import { loadPosts, loadSiteConfig } from "@/lib/content";

export default function sitemap(): MetadataRoute.Sitemap {
  const { meta } = loadSiteConfig();
  const base = meta.url || "https://example.com";
  const posts = loadPosts();

  return [
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    ...posts.map((post) => ({
      url: `${base}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
