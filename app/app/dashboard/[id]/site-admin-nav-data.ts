import type { SupabaseClient } from "@supabase/supabase-js";
import { siteAdminNavKind } from "@/src/lib/site-admin-nav";
import type { SiteAdminNavProps } from "@/app/components/dashboard/SiteAdminNav";

type SiteHosts = { id: string; subdomain: string; custom_domain: string | null };

/**
 * Sivuston yläpalkin tiedot: tyyppi (Pages vai overlay), nimi ja julkinen
 * osoite. Kutsujan on tarkistettava sivuston omistus ennen tätä.
 */
export async function loadSiteAdminNav(supabase: SupabaseClient, site: SiteHosts): Promise<SiteAdminNavProps> {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi";
  const [{ data: home }, { data: campaigns }] = await Promise.all([
    supabase.from("pages").select("id").eq("site_id", site.id).eq("slug", "home").maybeSingle(),
    supabase.from("overlay_campaigns").select("target_origin").eq("site_id", site.id).limit(1),
  ]);
  const kind = siteAdminNavKind({ hasHomePage: Boolean(home), campaignCount: campaigns?.length ?? 0 });
  const host = site.custom_domain || `${site.subdomain}.${rootDomain}`;
  const url = kind === "overlay" && campaigns?.[0] ? campaigns[0].target_origin : `https://${host}`;
  return {
    siteId: site.id,
    kind,
    label: url.replace(/^https?:\/\/(www\.)?/, ""),
    url,
  };
}
