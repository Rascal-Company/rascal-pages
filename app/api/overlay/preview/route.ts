import type { NextRequest } from "next/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { RateLimiter } from "@/src/lib/rate-limit";
import { previewSecret, verifyPreviewToken } from "@/src/lib/overlay-token";
import { proxiedPageResponse, proxyErrorPage } from "@/src/lib/overlay-proxy";

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
    .select("target_origin, path_pattern")
    .eq("id", variantId)
    .maybeSingle();
  if (!variant) return proxyErrorPage("Esikatselulinkki ei ole voimassa.", 404);

  const defaultPath = variant.path_pattern.includes("*") ? "/" : variant.path_pattern;
  const path = req.nextUrl.searchParams.get("path") || defaultPath;
  if (!path.startsWith("/")) return proxyErrorPage("Virheellinen polku.", 400);

  const target = new URL(path, variant.target_origin);
  if (target.origin !== variant.target_origin) {
    return proxyErrorPage("Virheellinen polku.", 400);
  }

  try {
    return await proxiedPageResponse(target, req.nextUrl.origin, { kind: "share", token });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tuntematon virhe.";
    return proxyErrorPage(message, 502);
  }
}
