import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { kpiWindows, type SiteKpis } from "@/src/lib/kpi";

type Range = { from: string; to?: string };

type Filters = { eq: Record<string, string>; in?: { column: string; values: string[] } };

async function countRows(
  client: SupabaseClient,
  table: string,
  filters: Filters,
  range: Range,
): Promise<number> {
  let query = client.from(table).select("id", { count: "exact", head: true });
  for (const [column, value] of Object.entries(filters.eq)) query = query.eq(column, value);
  if (filters.in) query = query.in(filters.in.column, filters.in.values);
  query = query.gte("created_at", range.from);
  if (range.to) query = query.lt("created_at", range.to);
  const { count, error } = await query;
  if (error) console.error(`KPI count error (${table}):`, error);
  return count ?? 0;
}

/**
 * Sivuston tunnusluvut 30 päivältä ja edelliseltä 30 päivältä.
 * Lander: sivunäytöt ja liidit. Overlay: snippetin näytöt ja konversiot.
 * Kutsutaan vain sivustoille, joiden omistajuus on jo tarkistettu.
 */
export async function loadSiteKpis(
  supabase: SupabaseClient,
  site: { id: string; kind: "lander" | "overlay" },
  now = new Date(),
): Promise<SiteKpis> {
  const { since, previousSince } = kpiWindows(now);
  const current: Range = { from: since };
  const previous: Range = { from: previousSince, to: since };

  if (site.kind === "lander") {
    const views = (r: Range) =>
      countRows(supabase, "analytics_events", { eq: { site_id: site.id, event_type: "page_view" } }, r);
    const leads = (r: Range) => countRows(supabase, "leads", { eq: { site_id: site.id } }, r);
    const [v, vp, l, lp] = await Promise.all([views(current), views(previous), leads(current), leads(previous)]);
    return { views: { current: v, previous: vp }, leads: { current: l, previous: lp } };
  }

  // overlay_events luetaan service-rolella (ei RLS-policyä asiakkaille).
  const admin = createAdminClient();
  const { data: variants } = await admin.from("overlay_variants").select("id").eq("site_id", site.id);
  const ids = (variants ?? []).map((v) => v.id as string);
  if (ids.length === 0) {
    return { views: { current: 0, previous: 0 }, leads: { current: 0, previous: 0 } };
  }
  const events = (type: "view" | "conversion", r: Range) =>
    countRows(
      admin,
      "overlay_events",
      { eq: { event_type: type }, in: { column: "variant_id", values: ids } },
      r,
    );
  const [v, vp, l, lp] = await Promise.all([
    events("view", current),
    events("view", previous),
    events("conversion", current),
    events("conversion", previous),
  ]);
  return { views: { current: v, previous: vp }, leads: { current: l, previous: lp } };
}
