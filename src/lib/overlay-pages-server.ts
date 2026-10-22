/**
 * Pages-sivun overlay-variantin valinta palvelimella: samat säännöt kuin
 * config-endpointissa ja o.js:ssä (pickTarget + assignVariant), mutta
 * kampanjat rajataan sivuston omistavaan organisaatioon.
 */
import { createAdminClient } from "@/src/utils/supabase/admin";
import {
  OVERLAY_MATCH_KEYS,
  assignVariant,
  parseMatch,
  pickTarget,
  type OverlayChange,
  type OverlayMatch,
} from "./overlay";
import { pagesSiteOrigins } from "./overlay-pages";
import { previewSecret, verifyPreviewToken } from "./overlay-token";

export const OVERLAY_PARAMS_COOKIE = "rp_overlay_params";
export const OVERLAY_VISITOR_COOKIE = "rp_overlay_vid";

export type PagesOverlaySite = {
  user_id: string;
  subdomain: string | null;
  custom_domain: string | null;
};

export type PagesOverlayRequest = {
  pathname: string;
  query: Record<string, string | string[] | undefined>;
  cookies: { params?: string; visitorId?: string };
};

export type PagesOverlay = {
  /** Kampanjan overlay-sivusto (tilastotapahtumien s-parametri). */
  overlaySiteId: string;
  variantId: string;
  changes: OverlayChange[];
  /** Jakolinkin esikatselu: ei tilastoja eikä evästeitä. */
  preview: boolean;
  params: OverlayMatch;
  visitorId: string;
};

type LandingPageRow = {
  id: string;
  path_pattern: string;
  match: OverlayMatch;
  updated_at: string;
  overlay_campaigns: {
    site_id: string;
    target_origin: string;
    sites: { user_id: string };
  };
  overlay_variants: { id: string; changes: OverlayChange[]; active: boolean }[];
};

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Kohdennusparametrit URL:sta, muuten session aikana tallennetut (eväste). */
export function readMatchParams(
  query: PagesOverlayRequest["query"],
  cookie: string | undefined,
): OverlayMatch {
  const fromUrl: Record<string, string> = {};
  for (const key of OVERLAY_MATCH_KEYS) {
    const value = first(query[key]);
    if (value) fromUrl[key] = value;
  }
  if (Object.keys(fromUrl).length > 0) return parseMatch(fromUrl);
  if (!cookie) return {};
  try {
    return parseMatch(JSON.parse(cookie));
  } catch {
    return {};
  }
}

/**
 * Organisaation Pages-sivusto, jonka origin kampanjalla on kohteena, tai null
 * (ulkoinen sivusto).
 */
export async function findPagesSite(
  orgId: string,
  origin: string,
): Promise<(PagesOverlaySite & { id: string }) | null> {
  const host = new URL(origin).hostname;
  const { data } = await createAdminClient()
    .from("sites")
    .select("id, user_id, subdomain, custom_domain")
    .eq("user_id", orgId);
  return (
    (data ?? []).find((site) => pagesSiteOrigins(site).some((o) => new URL(o).hostname === host)) ??
    null
  );
}

/**
 * Osoite, josta palvelin hakee oman Pages-sivun. Kehityksessä sivu tarjoillaan
 * paikallisesti (test.localhost:3000), tuotannossa julkisesta originista.
 */
export function pagesFetchUrl(
  site: PagesOverlaySite,
  path: string,
): { url: URL; trusted: boolean } {
  if (process.env.NODE_ENV === "development" && site.subdomain) {
    return { url: new URL(path, `http://${site.subdomain}.localhost:3000`), trusted: true };
  }
  return { url: new URL(path, pagesSiteOrigins(site)[0]), trusted: false };
}

export function newVisitorId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function validVisitorId(value: string | undefined): string | null {
  return value && /^[\w-]{8,64}$/.test(value) ? value : null;
}

const LANDING_PAGE_COLUMNS =
  "id, path_pattern, match, updated_at, overlay_campaigns!inner(site_id, target_origin, active, sites!inner(user_id)), overlay_variants(id, changes, active)";

async function previewOverlay(
  token: string,
  site: PagesOverlaySite,
  origins: string[],
): Promise<PagesOverlay | null> {
  const variantId = verifyPreviewToken(token, previewSecret());
  if (!variantId) return null;

  const { data } = await createAdminClient()
    .from("overlay_variants")
    .select(
      "id, changes, overlay_landing_pages!inner(overlay_campaigns!inner(site_id, target_origin, sites!inner(user_id)))",
    )
    .eq("id", variantId)
    .maybeSingle();
  const campaign = (
    data?.overlay_landing_pages as unknown as { overlay_campaigns: LandingPageRow["overlay_campaigns"] } | undefined
  )?.overlay_campaigns;
  if (!data || !campaign) return null;
  if (campaign.sites.user_id !== site.user_id || !origins.includes(campaign.target_origin)) {
    return null;
  }

  return {
    overlaySiteId: campaign.site_id,
    variantId: data.id,
    changes: (data.changes ?? []) as OverlayChange[],
    preview: true,
    params: {},
    visitorId: "",
  };
}

/**
 * Valitsee kävijälle Pages-sivun variaation. Virheet eivät saa rikkoa
 * julkista sivua, joten ne kirjataan ja sivu näytetään ilman overlayta.
 */
export async function resolvePagesOverlay(
  site: PagesOverlaySite,
  request: PagesOverlayRequest,
): Promise<PagesOverlay | null> {
  const origins = pagesSiteOrigins(site);
  if (origins.length === 0) return null;
  try {
    const token = first(request.query.t);
    if (token) return await previewOverlay(token, site, origins);

    const { data, error } = await createAdminClient()
      .from("overlay_landing_pages")
      .select(LANDING_PAGE_COLUMNS)
      .in("overlay_campaigns.target_origin", origins)
      .eq("overlay_campaigns.active", true);
    if (error) {
      console.error("Pages overlay error:", error);
      return null;
    }

    // Organisaatiorajaus tehdään tässä: vain sivuston omistajan kampanjat.
    // Kaikki originit ovat saman sivuston, joten verrataan yhteen.
    const pageUrl = new URL(request.pathname || "/", origins[0]);
    const candidates = ((data ?? []) as unknown as LandingPageRow[])
      .filter(
        (lp) =>
          lp.overlay_campaigns.sites.user_id === site.user_id &&
          origins.includes(lp.overlay_campaigns.target_origin),
      )
      .map((lp) => ({
        ...lp,
        target_origin: pageUrl.origin,
        variants: lp.overlay_variants.filter((v) => v.active),
      }))
      .filter((lp) => lp.variants.length > 0);
    if (candidates.length === 0) return null;

    const params = readMatchParams(request.query, request.cookies.params);
    const landingPage = pickTarget(candidates, pageUrl, params);
    if (!landingPage) return null;

    const visitorId = validVisitorId(request.cookies.visitorId) ?? newVisitorId();
    const variant = assignVariant(landingPage.variants, visitorId, landingPage.id);
    if (!variant) return null;

    return {
      overlaySiteId: landingPage.overlay_campaigns.site_id,
      variantId: variant.id,
      changes: variant.changes ?? [],
      preview: false,
      params,
      visitorId,
    };
  } catch (err) {
    console.error("Pages overlay error:", err);
    return null;
  }
}
