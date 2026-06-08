/**
 * Server-side data access for published tenant sites and their blog posts.
 * These helpers run in Server Components / Route Handlers and rely on the
 * cookie-aware Supabase client; RLS exposes published content to the public.
 */

import { headers } from "next/headers";
import { createClient } from "@/src/utils/supabase/server";
import { mapPostRow, sortPostsByPublishedAt, type Post, type PostRow } from "./posts";

export type SiteRecord = {
  id: string;
  subdomain: string | null;
  custom_domain: string | null;
  settings: Record<string, unknown> | null;
};

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
