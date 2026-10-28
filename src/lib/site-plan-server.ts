import { createAdminClient } from "@/src/utils/supabase/admin";
import {
  canCreateDraftSite,
  publishBlockReason,
  rascalQuotaFromProduct,
  resolveEntitlements,
  type Entitlements,
  type OrganizationProductRow,
  type PublishBlock,
  type RascalPagesQuota,
  type SiteBillingStatus,
  type SitePlan,
  type SitePlanTier,
} from "@/src/lib/entitlements";

/**
 * Pakettitiedon lataus palvelimella (RAS-1169). Admin-client, koska julkinen
 * renderöinti tarvitsee tilan ilman kirjautumista ja site_plans on RLS:llä
 * vain omistaja-orgin luettavissa.
 */

const DRAFT_PLAN: SitePlan = { tier: "draft", billingStatus: "none", pastDueSince: null };

type SitePlanRow = {
  site_id: string;
  tier: SitePlanTier;
  billing_status: SiteBillingStatus;
  past_due_since: string | null;
};

function toSitePlan(row: SitePlanRow | null | undefined): SitePlan {
  if (!row) return DRAFT_PLAN;
  return {
    tier: row.tier,
    billingStatus: row.billing_status,
    pastDueSince: row.past_due_since ? new Date(row.past_due_since) : null,
  };
}

export async function loadOrgRascalQuota(orgId: string): Promise<RascalPagesQuota | null> {
  const { data, error } = await createAdminClient()
    .from("organization_products")
    .select("is_enabled, plan_tier, settings, products!inner(slug)")
    .eq("org_id", orgId)
    .eq("products.slug", "rascal-pages")
    .maybeSingle();
  if (error) throw error;
  return rascalQuotaFromProduct(data as OrganizationProductRow | null);
}

async function loadSitePlan(siteId: string): Promise<SitePlan> {
  const { data, error } = await createAdminClient()
    .from("site_plans")
    .select("site_id, tier, billing_status, past_due_since")
    .eq("site_id", siteId)
    .maybeSingle();
  if (error) throw error;
  return toSitePlan(data as SitePlanRow | null);
}

export async function getSiteEntitlements(siteId: string, orgId: string): Promise<Entitlements> {
  const [sitePlan, rascal] = await Promise.all([loadSitePlan(siteId), loadOrgRascalQuota(orgId)]);
  return resolveEntitlements({ sitePlan, rascal, now: new Date() });
}

/**
 * Näytetäänkö sivusto julkisesti. Virhetilanteessa (esim. kanta ei vastaa)
 * sivusto näytetään: maksumuurin ohitus hetkeksi on pienempi haitta kuin
 * kaikkien asiakassivustojen katoaminen.
 */
export async function isSiteLive(siteId: string, orgId: string): Promise<boolean> {
  try {
    return (await getSiteEntitlements(siteId, orgId)).canPublish;
  } catch (error) {
    console.error("Sivuston pakettitilan tarkistus epäonnistui, näytetään sivusto:", error);
    return true;
  }
}

async function countOtherPublishedPages(siteId: string, pageSlug: string): Promise<number> {
  const { count, error } = await createAdminClient()
    .from("pages")
    .select("id", { count: "exact", head: true })
    .eq("site_id", siteId)
    .eq("published", true)
    .neq("slug", pageSlug);
  if (error) throw error;
  return count ?? 0;
}

export type PublishCheck = { ok: true } | { ok: false; code: PublishBlock | "CHECK_FAILED" };

/** Tarkistetaan kun sivu siirtyy julkaistuksi. Virhe estää julkaisun. */
export async function checkPagePublish(input: {
  siteId: string;
  orgId: string;
  pageSlug: string;
  templateId: string | null;
}): Promise<PublishCheck> {
  try {
    const [entitlements, publishedCount] = await Promise.all([
      getSiteEntitlements(input.siteId, input.orgId),
      countOtherPublishedPages(input.siteId, input.pageSlug),
    ]);
    const code = publishBlockReason({ entitlements, templateId: input.templateId, publishedCount });
    return code ? { ok: false, code } : { ok: true };
  } catch (error) {
    console.error("Julkaisuoikeuden tarkistus epäonnistui:", error);
    return { ok: false, code: "CHECK_FAILED" };
  }
}

/** Organisaation julkaisemattomat sivustot: ei site_plans-riviä tai tier = draft. */
export async function countDraftSites(orgId: string): Promise<number> {
  const admin = createAdminClient();
  const { data: sites, error } = await admin.from("sites").select("id").eq("user_id", orgId);
  if (error) throw error;
  const ids = (sites ?? []).map((s) => s.id as string);
  if (ids.length === 0) return 0;

  const { data: plans, error: planError } = await admin
    .from("site_plans")
    .select("site_id, tier")
    .in("site_id", ids);
  if (planError) throw planError;
  const paid = new Set((plans ?? []).filter((p) => p.tier !== "draft").map((p) => p.site_id as string));
  return ids.filter((id) => !paid.has(id)).length;
}

/** Saako organisaatio luoda uuden sivuston. Virhe estää luonnin. */
export async function canOrgCreateSite(orgId: string): Promise<boolean> {
  try {
    return canCreateDraftSite(await countDraftSites(orgId));
  } catch (error) {
    console.error("Luonnosrajan tarkistus epäonnistui:", error);
    return false;
  }
}

/** Overlayt ja personointi kuuluvat Rascal-pakettiin. */
export async function orgHasOverlays(orgId: string): Promise<boolean> {
  try {
    return (await loadOrgRascalQuota(orgId)) !== null;
  } catch (error) {
    console.error("Rascal-oikeuden tarkistus epäonnistui:", error);
    return false;
  }
}
