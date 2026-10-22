import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/src/utils/supabase/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { getHomeUrl } from "@/app/lib/navigation";
import { createOverlayProfileId } from "@/src/lib/overlay-campaign";
import type { OverlayProfile } from "@/app/actions/overlay";
import { pagesSiteOrigins } from "@/src/lib/overlay-pages";

/** Kirjautunut käyttäjä ja organisaatio (CLAUDE.md:n auktorisointikaava). */
export async function loadOrgContext() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(getHomeUrl());

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!orgMember) redirect("/app/dashboard");

  return { supabase, orgId: orgMember.org_id as string };
}

/** Overlay-sivujen yhteinen alku: organisaatio ja sivuston omistajuus. */
export async function loadOverlayContext(siteId: string) {
  const { supabase, orgId } = await loadOrgContext();

  const { data: site } = await supabase
    .from("sites")
    .select("id, subdomain")
    .eq("id", siteId)
    .eq("user_id", orgId)
    .maybeSingle();
  if (!site) notFound();

  return { supabase, orgId, site };
}

export async function loadProfiles(
  supabase: SupabaseClient,
  orgId: string,
): Promise<OverlayProfile[]> {
  const { data } = await supabase
    .from("overlay_profiles")
    .select("id, name, description, source")
    .eq("org_id", orgId)
    .order("name");

  return (data ?? []).map((p) => ({
    id: createOverlayProfileId(p.id),
    name: p.name,
    description: p.description,
    source: p.source as OverlayProfile["source"],
  }));
}

export type VariantStats = {
  visitors: number;
  views: number;
  convertedVisitors: number;
};

/** Variaatiokohtaiset tilastot kampanjalle (kutsutaan omistajuustarkistuksen jälkeen). */
export async function loadVariantStats(campaignId: string): Promise<Map<string, VariantStats>> {
  const { data, error } = await createAdminClient().rpc("overlay_variant_stats", {
    p_campaign_id: campaignId,
  });
  if (error) console.error("Overlay stats error:", error);

  const stats = new Map<string, VariantStats>();
  for (const row of (data ?? []) as {
    variant_id: string;
    visitors: number;
    views: number;
    converted_visitors: number;
  }[]) {
    stats.set(row.variant_id, {
      visitors: Number(row.visitors),
      views: Number(row.views),
      convertedVisitors: Number(row.converted_visitors),
    });
  }
  return stats;
}

export function sumStats(list: (VariantStats | undefined)[]): VariantStats {
  return list.reduce<VariantStats>(
    (acc, s) => ({
      visitors: acc.visitors + (s?.visitors ?? 0),
      views: acc.views + (s?.views ?? 0),
      convertedVisitors: acc.convertedVisitors + (s?.convertedVisitors ?? 0),
    }),
    { visitors: 0, views: 0, convertedVisitors: 0 },
  );
}

export type PagesTarget = { id: string; label: string; origin: string };

/** Organisaation Pages-sivustot (joilla on etusivu), overlay-kampanjan kohteiksi. */
export async function loadPagesTargets(
  supabase: SupabaseClient,
  orgId: string,
): Promise<PagesTarget[]> {
  const { data } = await supabase
    .from("sites")
    .select("id, subdomain, custom_domain, pages!inner(slug)")
    .eq("user_id", orgId)
    .eq("pages.slug", "home")
    .order("subdomain");

  return (data ?? []).flatMap((site) => {
    const origin = pagesSiteOrigins(site)[0];
    return origin ? [{ id: site.id, label: origin.replace(/^https:\/\//, ""), origin }] : [];
  });
}
