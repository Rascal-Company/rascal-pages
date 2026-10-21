import type { NextRequest } from "next/server";
import { createClient } from "@/src/utils/supabase/server";
import { isValidUuid } from "@/src/lib/types";
import { proxiedPageResponse, proxyErrorPage } from "@/src/lib/overlay-proxy";

/**
 * Overlay-editorin proxy: /api/overlay/proxy?c=CAMPAIGN_ID&path=/polku
 * Hakee kampanjan kohdesivun (vain kampanjan omasta originista) ja palauttaa
 * sen editorin iframeen ilman asiakkaan skriptejä.
 */
export async function GET(req: NextRequest) {
  const campaignId = req.nextUrl.searchParams.get("c") ?? "";
  const path = req.nextUrl.searchParams.get("path") || "/";
  if (!isValidUuid(campaignId) || !path.startsWith("/")) {
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

  const { data: campaign } = await supabase
    .from("overlay_campaigns")
    .select("target_origin, sites!inner(user_id)")
    .eq("id", campaignId)
    .maybeSingle();

  const site = campaign?.sites as unknown as { user_id: string } | undefined;
  if (!campaign || !orgMember || site?.user_id !== orgMember.org_id) {
    return proxyErrorPage("Kampanjaa ei löydy.", 404);
  }

  // Polku liitetään aina kampanjan originiin, joten proxyllä ei voi hakea
  // mielivaltaisia osoitteita.
  const target = new URL(path, campaign.target_origin);
  if (target.origin !== campaign.target_origin) {
    return proxyErrorPage("Virheellinen polku.", 400);
  }

  try {
    return await proxiedPageResponse(target, req.nextUrl.origin, { kind: "editor" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tuntematon virhe.";
    return proxyErrorPage(message, 502);
  }
}
