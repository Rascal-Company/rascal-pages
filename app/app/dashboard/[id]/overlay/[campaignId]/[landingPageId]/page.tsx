import { notFound } from "next/navigation";
import { createSiteId } from "@/src/lib/types";
import { createOverlayVariantId, parseMatch } from "@/src/lib/overlay";
import {
  createOverlayCampaignId,
  createOverlayLandingPageId,
  type OverlaySlot,
  type OverlaySlotValues,
} from "@/src/lib/overlay-campaign";
import { createPreviewToken, previewSecret } from "@/src/lib/overlay-token";
import type { OverlayVariation } from "@/app/actions/overlay";
import { getAppOrigin } from "../../app-origin";
import { loadOverlayContext, loadProfiles } from "../../overlay-data";
import LandingPageEditor from "./LandingPageEditor";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string; campaignId: string; landingPageId: string }>;
}

export default async function OverlayLandingPagePage({ params }: PageProps) {
  const { id, campaignId, landingPageId } = await params;
  const { supabase, orgId } = await loadOverlayContext(id);

  const { data: campaign } = await supabase
    .from("overlay_campaigns")
    .select("id, target_origin")
    .eq("id", campaignId)
    .eq("site_id", id)
    .maybeSingle();
  if (!campaign) notFound();

  const { data: landingPage } = await supabase
    .from("overlay_landing_pages")
    .select("id, name, path_pattern, match, profile_id, slots")
    .eq("id", landingPageId)
    .eq("campaign_id", campaignId)
    .maybeSingle();
  if (!landingPage) notFound();

  const { data: rows } = await supabase
    .from("overlay_variants")
    .select("id, name, prompt, slot_values, active")
    .eq("landing_page_id", landingPageId)
    .order("created_at", { ascending: true });

  const secret = previewSecret();
  const variants: OverlayVariation[] = (rows ?? []).map((row) => {
    const variantId = createOverlayVariantId(row.id);
    return {
      id: variantId,
      name: row.name,
      prompt: row.prompt,
      values: (row.slot_values ?? {}) as OverlaySlotValues,
      active: row.active,
      previewToken: createPreviewToken(variantId, secret),
    };
  });

  return (
    <LandingPageEditor
      siteId={createSiteId(id)}
      campaignId={createOverlayCampaignId(campaign.id)}
      landingPageId={createOverlayLandingPageId(landingPage.id)}
      targetOrigin={campaign.target_origin}
      appOrigin={await getAppOrigin()}
      initialLandingPage={{
        name: landingPage.name,
        pathPattern: landingPage.path_pattern,
        match: parseMatch(landingPage.match),
        profileId: landingPage.profile_id,
        slots: landingPage.slots as OverlaySlot[],
      }}
      initialVariants={variants}
      profiles={await loadProfiles(supabase, orgId)}
    />
  );
}
