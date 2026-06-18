/**
 * Server-side data access for published tenant sites and their blog posts.
 * These helpers run in Server Components / Route Handlers and rely on the
 * cookie-aware Supabase client; RLS exposes published content to the public.
 */

import { headers } from "next/headers";
import { createClient } from "@/src/utils/supabase/server";
import { mapPostRow, sortPostsByPublishedAt, type Post, type PostRow } from "./posts";
import { migrateToSections } from "@/app/components/editor/utils/contentUtils";
import type {
  HeroContent,
  TemplateConfig,
  ThemeConfig,
} from "./templates";
import type { SiteNavLink } from "./site-nav";

export type SiteRecord = {
  id: string;
  subdomain: string | null;
  custom_domain: string | null;
  settings: Record<string, unknown> | null;
};

/**
 * Shared "chrome" for a tenant site: the theme and navigation that must stay
 * consistent across the home page, subpages and the blog. `navLinks` lists the
 * site's published pages (home + subpages) plus the blog when posts exist;
 * `showNav` is true only when there is more than one destination, so single
 * landing pages keep their header-less look.
 */
export type SiteChrome = {
  brand: string;
  theme: ThemeConfig;
  templateId: string;
  navLinks: SiteNavLink[];
  showNav: boolean;
};

type PublishedPageRow = {
  slug: string;
  title: string;
  content: unknown;
};

/**
 * Resolve the shared header/theme for a site from its published pages. The home
 * page supplies the brand name (hero title), theme and template; subpages and
 * the blog contribute navigation links.
 */
export async function getSiteChrome(siteId: string): Promise<SiteChrome> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select("slug, title, content")
    .eq("site_id", siteId)
    .eq("published", true)
    .order("created_at", { ascending: true });

  const pages = (data as PublishedPageRow[] | null) ?? [];
  const home = pages.find((p) => p.slug === "home");
  const homeConfig = migrateToSections(
    (home?.content as TemplateConfig | null) ?? undefined,
  );
  const hero = homeConfig.sections.find((s) => s.type === "hero")?.content as
    | HeroContent
    | undefined;

  const navLinks: SiteNavLink[] = [];
  if (home) navLinks.push({ label: "Etusivu", href: "/" });
  for (const page of pages) {
    if (page.slug === "home") continue;
    navLinks.push({ label: page.title || page.slug, href: `/${page.slug}` });
  }

  const latestPosts = await getPublishedPosts(siteId, 1);
  if (latestPosts.length > 0) navLinks.push({ label: "Blogi", href: "/blog" });

  return {
    brand: hero?.title?.trim() || "",
    theme: homeConfig.theme,
    templateId: homeConfig.templateId,
    navLinks,
    showNav: navLinks.length > 1,
  };
}

/**
 * Fetch a single published page (subpage) by slug within a site.
 */
export async function getPublishedPageBySlug(
  siteId: string,
  slug: string,
): Promise<{ title: string; content: TemplateConfig } | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pages")
    .select("title, content")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!data) return null;
  return {
    title: (data as PublishedPageRow).title,
    content: (data as PublishedPageRow).content as TemplateConfig,
  };
}

/**
 * Look up a site by its subdomain or custom domain.
 */
export async function getSiteByDomain(domain: string): Promise<SiteRecord | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sites")
    .select("*")
    .or(`subdomain.eq.${domain},custom_domain.eq.${domain}`)
    .maybeSingle();

  return (data as SiteRecord | null) ?? null;
}

/**
 * Fetch published posts for a site, newest-first. Pass `limit` to cap results.
 */
export async function getPublishedPosts(
  siteId: string,
  limit?: number,
): Promise<Post[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("site_id", siteId)
    .eq("published", true)
    .order("published_at", { ascending: false });

  if (error || !data) return [];

  const posts = sortPostsByPublishedAt((data as PostRow[]).map(mapPostRow));
  return typeof limit === "number" ? posts.slice(0, limit) : posts;
}

/**
 * Fetch a single published post by its slug within a site.
 */
export async function getPostBySlug(
  siteId: string,
  slug: string,
): Promise<Post | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("site_id", siteId)
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) return null;
  return mapPostRow(data as PostRow);
}

/**
 * Build the absolute base URL for the current request from forwarded headers.
 */
export async function getRequestBaseUrl(): Promise<string> {
  const headerList = await headers();
  const host = headerList.get("host") ?? "";
  const proto = headerList.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}
