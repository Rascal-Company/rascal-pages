import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { isValidUuid } from "@/src/lib/types";
import { previewSecret, verifyPreviewToken } from "@/src/lib/overlay-token";
import {
  OVERLAY_MATCH_KEYS,
  pickVariant,
  type OverlayMatch,
  type OverlayVariantRow,
} from "@/src/lib/overlay";

/**
 * Julkinen endpoint o.js-snippetille: palauttaa kävijälle valitun variantin
 * muutokset. Kutsutaan asiakkaan sivulta, joten CORS on auki kaikille.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

function json(body: unknown, cache: string) {
  return NextResponse.json(body, {
    headers: { ...CORS_HEADERS, "Cache-Control": cache },
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/** Jakolinkin esikatselu: variantin tallennetut muutokset tunnisteella, myös luonnoksena. */
async function previewChanges(token: string) {
  const variantId = verifyPreviewToken(token, previewSecret());
  if (!variantId) return json({ changes: [] }, "no-store");

  const { data } = await createAdminClient()
    .from("overlay_variants")
    .select("id, changes")
    .eq("id", variantId)
    .maybeSingle();

  return json({ variant: data?.id ?? null, changes: data?.changes ?? [] }, "no-store");
}

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams;
  const token = search.get("t");
  if (token) return previewChanges(token);

  const siteId = search.get("s") ?? "";
  const rawUrl = search.get("u") ?? "";

  let pageUrl: URL;
  try {
    pageUrl = new URL(rawUrl);
  } catch {
    return json({ changes: [] }, "no-store");
  }
  if (!isValidUuid(siteId)) return json({ changes: [] }, "no-store");

  const params: OverlayMatch = {};
  for (const key of OVERLAY_MATCH_KEYS) {
    const value = search.get(key);
    if (value) params[key] = value;
  }

  const { data, error } = await createAdminClient()
    .from("overlay_variants")
    .select("id, target_origin, path_pattern, match, changes, updated_at")
    .eq("site_id", siteId)
    .eq("target_origin", pageUrl.origin)
    .eq("active", true);

  if (error) {
    console.error("Overlay config error:", error);
    return json({ changes: [] }, "no-store");
  }

  const variant = pickVariant((data ?? []) as OverlayVariantRow[], pageUrl, params);

  // Lyhyt CDN-cache: muutokset näkyvät minuutissa, mutta liikennepiikit
  // eivät kuormita kantaa.
  return json(
    { variant: variant?.id ?? null, changes: variant?.changes ?? [] },
    "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
  );
}
