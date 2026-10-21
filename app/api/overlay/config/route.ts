import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { isValidUuid } from "@/src/lib/types";
import { previewSecret, verifyPreviewToken } from "@/src/lib/overlay-token";
import {
  OVERLAY_MATCH_KEYS,
  pickTarget,
  type OverlayChange,
  type OverlayMatch,
} from "@/src/lib/overlay";

/**
 * Julkinen endpoint o.js-snippetille: palauttaa kävijälle valitun
 * laskeutumissivun julkaistut variaatiot. Snippet arpoo kävijän variaation
 * (A/B), joten vastaus on sama kaikille ja välimuistiin sopiva.
 * Kutsutaan asiakkaan sivulta, joten CORS on auki kaikille.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

type ConfigVariant = { id: string; changes: OverlayChange[] };

const EMPTY = { landingPage: null, variants: [] as ConfigVariant[] };

function json(body: unknown, cache: string) {
  return NextResponse.json(body, {
    headers: { ...CORS_HEADERS, "Cache-Control": cache },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** Jakolinkin esikatselu: yksi variaatio tunnisteella, myös luonnoksena. */
async function previewConfig(token: string) {
  const variantId = verifyPreviewToken(token, previewSecret());
  if (!variantId) return json(EMPTY, "no-store");

  const { data } = await createAdminClient()
    .from("overlay_variants")
    .select("id, landing_page_id, changes")
    .eq("id", variantId)
    .maybeSingle();
  if (!data) return json(EMPTY, "no-store");

  return json(
    {
      landingPage: data.landing_page_id,
      variants: [{ id: data.id, changes: data.changes ?? [] }],
      preview: true,
    },
    "no-store",
  );
}

type LandingPageRow = {
  id: string;
  path_pattern: string;
  match: OverlayMatch;
  updated_at: string;
  overlay_campaigns: { target_origin: string };
  overlay_variants: { id: string; changes: OverlayChange[]; active: boolean }[];
};

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  const token = search.get("t");
  if (token) return previewConfig(token);

  const siteId = search.get("s") ?? "";
  let pageUrl: URL;
  try {
    pageUrl = new URL(search.get("u") ?? "");
  } catch {
    return json(EMPTY, "no-store");
  }
  if (!isValidUuid(siteId)) return json(EMPTY, "no-store");

  const params: OverlayMatch = {};
  for (const key of OVERLAY_MATCH_KEYS) {
    const value = search.get(key);
    if (value) params[key] = value;
  }

  const { data, error } = await createAdminClient()
    .from("overlay_landing_pages")
    .select(
      "id, path_pattern, match, updated_at, overlay_campaigns!inner(site_id, target_origin, active), overlay_variants(id, changes, active)",
    )
    .eq("overlay_campaigns.site_id", siteId)
    .eq("overlay_campaigns.target_origin", pageUrl.origin)
    .eq("overlay_campaigns.active", true);

  if (error) {
    console.error("Overlay config error:", error);
    return json(EMPTY, "no-store");
  }

  // Vain laskeutumissivut, joilla on vähintään yksi julkaistu variaatio.
  const candidates = ((data ?? []) as unknown as LandingPageRow[])
    .map((lp) => ({
      ...lp,
      target_origin: lp.overlay_campaigns.target_origin,
      variants: lp.overlay_variants.filter((v) => v.active),
    }))
    .filter((lp) => lp.variants.length > 0);

  const landingPage = pickTarget(candidates, pageUrl, params);

  // Lyhyt CDN-cache: muutokset näkyvät minuutissa, mutta liikennepiikit
  // eivät kuormita kantaa.
  return json(
    landingPage
      ? {
          landingPage: landingPage.id,
          variants: landingPage.variants.map((v) => ({ id: v.id, changes: v.changes })),
        }
      : EMPTY,
    "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
  );
}
