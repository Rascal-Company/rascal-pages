import type { NextRequest } from "next/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { RateLimiter } from "@/src/lib/rate-limit";
import { previewSecret, verifyPreviewToken } from "@/src/lib/overlay-token";
import { proxiedPageResponse, proxyErrorPage } from "@/src/lib/overlay-proxy";
import { findPagesSite, pagesFetchUrl } from "@/src/lib/overlay-pages-server";

/**
 * Julkinen esikatselulinkki: /api/overlay/preview?t=TOKEN&path=/polku
 * Näyttää variantin asiakkaan sivulla ilman kirjautumista ja ilman
 * asennettua snippetiä — myyntiä ja hyväksyntää varten ennen asennusta.
 * Toimii myös luonnosvarianteille; tunniste on allekirjoitettu.
 */
const previewLimiter = new RateLimiter({ maxRequests: 60, windowMs: 15 * 60 * 1000 });

export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!previewLimiter.check(ip).allowed) {
    return proxyErrorPage("Liian monta pyyntöä. Yritä hetken päästä uudelleen.", 429);
  }

  const token = req.nextUrl.searchParams.get("t") ?? "";
  const variantId = verifyPreviewToken(token, previewSecret());
  if (!variantId) return proxyErrorPage("Esikatselulinkki ei ole voimassa.", 404);

  const { data: variant } = await createAdminClient()
    .from("overlay_variants")
    .select(
      "overlay_landing_pages!inner(path_pattern, overlay_campaigns!inner(target_origin, sites!inner(user_id)))",
    )
    .eq("id", variantId)
    .maybeSingle();
  const landingPage = variant?.overlay_landing_pages as unknown as
    | {
        path_pattern: string;
        overlay_campaigns: { target_origin: string; sites: { user_id: string } };
      }
    | undefined;
  if (!landingPage) return proxyErrorPage("Esikatselulinkki ei ole voimassa.", 404);

  const origin = landingPage.overlay_campaigns.target_origin;
  const defaultPath = landingPage.path_pattern.includes("*") ? "/" : landingPage.path_pattern;
  const path = req.nextUrl.searchParams.get("path") || defaultPath;
  if (!path.startsWith("/")) return proxyErrorPage("Virheellinen polku.", 400);

  const target = new URL(path, origin);
  if (target.origin !== origin) {
    return proxyErrorPage("Virheellinen polku.", 400);
  }

  // Oma Pages-sivu renderöi esikatselun itse palvelimella (?t=).
  const pagesSite = await findPagesSite(landingPage.overlay_campaigns.sites.user_id, origin);
  if (pagesSite) {
    const { url } = pagesFetchUrl(pagesSite, target.pathname);
    url.searchParams.set("t", token);
    return Response.redirect(url, 302);
  }

  try {
    return await proxiedPageResponse(target, req.nextUrl.origin, { kind: "share", token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tuntematon virhe.";
    return proxyErrorPage(message, 502);
  }
}
