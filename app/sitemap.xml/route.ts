import { headers } from "next/headers";
import { hostToSiteDomain } from "@/src/lib/domains";
import { buildCanonicalUrl } from "@/src/lib/seo";
import { getPublishedPosts, getSiteByDomain } from "@/src/lib/site-queries";

export const dynamic = "force-dynamic";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi";

type SitemapEntry = {
  loc: string;
  lastmod?: string;
};

function renderSitemap(entries: SitemapEntry[]): string {
  const urls = entries
    .map(({ loc, lastmod }) => {
      const lastmodTag = lastmod ? `<lastmod>${lastmod}</lastmod>` : "";
      return `<url><loc>${loc}</loc>${lastmodTag}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
}

export async function GET() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const baseUrl = `${proto}://${host}`;
  const domain = hostToSiteDomain(host, ROOT_DOMAIN);

  const site = await getSiteByDomain(domain);

  const entries: SitemapEntry[] = [
    { loc: buildCanonicalUrl(baseUrl, "/") },
    { loc: buildCanonicalUrl(baseUrl, "/blog") },
  ];

  if (site) {
    const posts = await getPublishedPosts(site.id);
    for (const post of posts) {
      entries.push({
        loc: buildCanonicalUrl(baseUrl, `/blog/${post.slug}`),
        lastmod: post.updatedAt,
      });
    }
  }

  return new Response(renderSitemap(entries), {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
