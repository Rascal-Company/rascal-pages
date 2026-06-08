import type { MetadataRoute } from "next";
import { loadSiteConfig } from "@/lib/content";

export default function robots(): MetadataRoute.Robots {
  const { meta } = loadSiteConfig();
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: meta.url ? `${meta.url}/sitemap.xml` : undefined,
  };
}
