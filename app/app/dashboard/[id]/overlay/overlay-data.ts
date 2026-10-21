import { notFound, redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/src/utils/supabase/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { getHomeUrl } from "@/app/lib/navigation";
import { createOverlayProfileId } from "@/src/lib/overlay-campaign";
import type { OverlayProfile } from "@/app/actions/overlay";

/**
 * Overlay-sivujen yhteinen alku: kirjautunut käyttäjä, organisaatio ja
 * sivuston omistajuus (CLAUDE.md:n auktorisointikaava).
 */
export async function loadOverlayContext(siteId: string) {
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

  const { data: site } = await supabase
    .from("sites")
    .select("id, subdomain")
    .eq("id", siteId)
    .eq("user_id", orgMember.org_id)
    .maybeSingle();
  if (!site) notFound();

  return { supabase, orgId: orgMember.org_id as string, site };
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
