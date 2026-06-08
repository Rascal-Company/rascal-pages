import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  const sitemapUrl = `${proto}://${host}/sitemap.xml`;

  const body = ["User-agent: *", "Allow: /", "", `Sitemap: ${sitemapUrl}`, ""].join(
    "\n",
  );

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
