import type { NextRequest } from "next/server";
import { createClient } from "@/src/utils/supabase/server";
import { isValidUuid } from "@/src/lib/types";
import { proxiedPageResponse, proxyErrorPage } from "@/src/lib/overlay-proxy";

/**
 * Overlay-editorin proxy: /api/overlay/proxy?v=VARIANT_ID&path=/polku
 * Hakee variantin kohdesivun (vain variantin omasta originista) ja palauttaa
 * sen editorin iframeen ilman asiakkaan skriptejä.
 */
export async function GET(req: NextRequest) {
  const variantId = req.nextUrl.searchParams.get("v") ?? "";
  const path = req.nextUrl.searchParams.get("path") || "/";
  if (!isValidUuid(variantId) || !path.startsWith("/")) {
    return proxyErrorPage("Virheellinen pyyntö.", 400);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return proxyErrorPage("Kirjaudu sisään.", 401);

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
    return proxyErrorPage("Varianttia ei löydy.", 404);
  }

  // Polku liitetään aina variantin originiin, joten proxyllä ei voi hakea
  // mielivaltaisia osoitteita.
  const target = new URL(path, variant.target_origin);
  if (target.origin !== variant.target_origin) {
    return proxyErrorPage("Virheellinen polku.", 400);
  }

  try {
    return await proxiedPageResponse(target, req.nextUrl.origin, { kind: "editor" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tuntematon virhe.";
    return proxyErrorPage(message, 502);
  }
}
