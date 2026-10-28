/**
 * Sivuston oikeudet paketin mukaan (RAS-1168, spec 2026-10-28
 * hinnoittelu-julkaisu-waitlist). Puhdas: UI, server actionit ja julkinen
 * renderöinti kysyvät kaikki samalta funktiolta.
 */

export type SitePlanTier = "draft" | "basic" | "rascal";
export type SiteBillingStatus = "none" | "active" | "past_due" | "canceled";

export type SitePlan = {
  tier: SitePlanTier;
  billingStatus: SiteBillingStatus;
  pastDueSince: Date | null;
};

/** Rascal-paketin Pages-kiintiöt (organization_products / rascal-pages, settings). */
export type RascalPagesQuota = {
  includedSites: number;
  /** null = rajaton */
  maxPages: number | null;
};

export type Entitlements = {
  canPublish: boolean;
  /** "all" tai sallitut templateId:t (lukitut näytetään 🔒). */
  allowedTemplateIds: "all" | ReadonlySet<string>;
  overlays: boolean;
  /** Julkaistuja sivuja per sivusto; null = rajaton. Blogi ei laske. */
  maxPublishedPages: number | null;
  customDomain: boolean;
  showBadge: boolean;
};

export const BASIC_PAGE_LIMIT = 5;
export const DRAFT_SITE_LIMIT = 3;
export const PAST_DUE_GRACE_DAYS = 7;

/** Basicissa vain portfolio-/referenssisivut; tyhjä pohja on mukana omaa sivua varten. */
export const BASIC_TEMPLATE_IDS: ReadonlySet<string> = new Set([
  "portfolio",
  "personal",
  "personal-brand",
  "blank",
]);

const DEFAULT_RASCAL_QUOTA: RascalPagesQuota = { includedSites: 1, maxPages: 25 };

const DAY_MS = 24 * 60 * 60 * 1000;

export type OrganizationProductRow = {
  is_enabled: boolean;
  plan_tier: string | null;
  settings: unknown;
};

function nonNegativeInt(value: unknown): number | null {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : null;
}

/**
 * Lukee Rascal-oikeuden organisaation rascal-pages-riviltä. Trial ei oikeuta,
 * ja puuttuvat tai virheelliset kiintiöt saavat oletukset (1 sivusto, 25 sivua).
 * `max_pages: null` tarkoittaa rajatonta.
 */
export function rascalQuotaFromProduct(row: OrganizationProductRow | null): RascalPagesQuota | null {
  if (!row || !row.is_enabled || row.plan_tier === "trial") return null;

  const settings =
    row.settings && typeof row.settings === "object" ? (row.settings as Record<string, unknown>) : {};
  const includedSites = nonNegativeInt(settings.included_sites) ?? DEFAULT_RASCAL_QUOTA.includedSites;
  const maxPages =
    settings.max_pages === null
      ? null
      : (nonNegativeInt(settings.max_pages) ?? DEFAULT_RASCAL_QUOTA.maxPages);

  return { includedSites, maxPages };
}

function isBillingLive(plan: SitePlan, now: Date): boolean {
  if (plan.billingStatus === "active") return true;
  if (plan.billingStatus !== "past_due" || !plan.pastDueSince) return false;
  return now.getTime() - plan.pastDueSince.getTime() < PAST_DUE_GRACE_DAYS * DAY_MS;
}

export function resolveEntitlements(input: {
  sitePlan: SitePlan;
  rascal: RascalPagesQuota | null;
  now: Date;
}): Entitlements {
  const { sitePlan, rascal, now } = input;

  const canPublish =
    sitePlan.tier === "rascal" ? rascal !== null
    : sitePlan.tier === "basic" ? isBillingLive(sitePlan, now)
    : false;

  // Rascal-organisaation kaikki sivustot (myös maksetut lisäsivustot) perivät Rascal-ominaisuudet.
  const features: Omit<Entitlements, "canPublish" | "customDomain"> = rascal
    ? {
        allowedTemplateIds: "all",
        overlays: true,
        maxPublishedPages: rascal.maxPages,
        showBadge: false,
      }
    : {
        allowedTemplateIds: BASIC_TEMPLATE_IDS,
        overlays: false,
        maxPublishedPages: BASIC_PAGE_LIMIT,
        showBadge: true,
      };

  return { ...features, canPublish, customDomain: sitePlan.tier !== "draft" };
}

export function isTemplateAllowed(entitlements: Entitlements, templateId: string): boolean {
  return entitlements.allowedTemplateIds === "all" || entitlements.allowedTemplateIds.has(templateId);
}

/** Voiko sivustolle julkaista vielä yhden sivun, kun `publishedCount` on jo julkaistu. */
export function canPublishAnotherPage(entitlements: Entitlements, publishedCount: number): boolean {
  return entitlements.maxPublishedPages === null || publishedCount < entitlements.maxPublishedPages;
}
