import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/src/utils/supabase/server";
import { isValidUuid } from "@/src/lib/types";
import {
  fetchPublicHtml,
  proxyCsp,
  rewriteProxiedHtml,
} from "@/src/lib/overlay-proxy";

/**
 * Overlay-editorin proxy: /api/overlay/proxy?v=VARIANT_ID&path=/polku
 * Hakee variantin kohdesivun (vain variantin omasta originista) ja palauttaa
 * sen editorin iframeen ilman asiakkaan skriptejä.
 */
function errorPage(message: string, status: number) {
  return new NextResponse(
    `<!doctype html><meta charset="utf-8"><body style="font-family:system-ui;padding:2rem;color:#333"><h2>Sivua ei voitu ladata</h2><p>${message.replace(/</g, "&lt;")}</p></body>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const variantId = req.nextUrl.searchParams.get("v") ?? "";
  const path = req.nextUrl.searchParams.get("path") || "/";
  if (!isValidUuid(variantId) || !path.startsWith("/")) {
    return errorPage("Virheellinen pyyntö.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return errorPage("Kirjaudu sisään.", 401);

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  const { data: variant } = await supabase
    .from("overlay_variants")
    .select("target_origin, sites!inner(user_id)")
    .eq("id", variantId)
    .maybeSingle();

  const site = variant?.sites as unknown as { user_id: string } | undefined;
  if (!variant || !orgMember || site?.user_id !== orgMember.org_id) {
    return errorPage("Varianttia ei löydy.", 404);
  }

  // Polku liitetään aina variantin originiin, joten proxyllä ei voi hakea
  // mielivaltaisia osoitteita.
  const target = new URL(path, variant.target_origin);
  if (target.origin !== variant.target_origin) {
    return errorPage("Virheellinen polku.", 400);
  }

  try {
    const { html, finalUrl } = await fetchPublicHtml(target);
    const appOrigin = req.nextUrl.origin;
    const body = rewriteProxiedHtml(
      html,
      finalUrl.toString(),
      `${appOrigin}/overlay/o.js`,
    );

    return new NextResponse(body, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Content-Security-Policy": proxyCsp(appOrigin),
        "X-Frame-Options": "SAMEORIGIN",
        "X-Robots-Tag": "noindex, nofollow",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tuntematon virhe.";
    return errorPage(message, 502);
  }
}
