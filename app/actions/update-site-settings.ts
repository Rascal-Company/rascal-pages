"use server";

import { createClient } from "@/src/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { SiteId } from "@/src/lib/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeSettings } from "./utils/settings-utils";

type UpdateSettingsResult =
  | { success: true }
  | { success: false; error: string };

type AnalyticsSettings = {
  googleTagManagerId?: string;
  googleAnalyticsId?: string;
  metaPixelId?: string;
};

/**
 * Core function for updating site settings - testable without auth
 * Used by integration tests
 */
export async function updateSiteSettingsCore(
  client: SupabaseClient,
  siteId: SiteId,
  orgId: string,
  settings: AnalyticsSettings,
): Promise<UpdateSettingsResult> {
  // 1. Varmista omistajuus ja hae nykyiset asetukset
  const { data: site, error: siteError } = await client
    .from("sites")
    .select("settings")
    .eq("id", siteId)
    .eq("user_id", orgId)
    .single();

  if (siteError || !site) {
    return {
      success: false,
      error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia.",
    };
  }

  // 2. Yhdistä uudet asetukset vanhoihin
  const currentSettings = (site.settings as Record<string, unknown>) || {};
  const newSettings = mergeSettings(currentSettings, settings);

  // 3. Tallenna
  const { error: updateError } = await client
    .from("sites")
    .update({
      settings: newSettings,
      updated_at: new Date().toISOString(),
    })
    .eq("id", siteId);

  if (updateError) {
    console.error("Update settings error:", updateError);
    return { success: false, error: "Asetusten tallennus epäonnistui." };
  }

  return { success: true };
}

/**
 * Server Action for updating site analytics settings
 */
export async function updateSiteSettings(
  siteId: SiteId,
  settings: AnalyticsSettings,
): Promise<UpdateSettingsResult> {
  const supabase = await createClient();

  // 1. Tarkista käyttäjä
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Sinun täytyy olla kirjautunut sisään." };
  }

  // 2. Hae käyttäjän organisaatio
  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember) {
    return { success: false, error: "Käyttäjätiliä ei löydy." };
  }

  const result = await updateSiteSettingsCore(
    supabase,
    siteId,
    orgMember.org_id,
    settings,
  );

  if (result.success) {
    revalidatePath(`/app/dashboard/${siteId}/settings`);
  }

  return result;
}
