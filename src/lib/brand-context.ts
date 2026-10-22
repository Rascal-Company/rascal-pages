/**
 * Organisaation Rascal AI -profiili (public.users) tekoälyn brändikontekstiksi.
 * Vain palvelimella: lukee admin-clientillä.
 */
import { createAdminClient } from "@/src/utils/supabase/admin";
import type { BrandContext } from "./overlay-campaign";

/** Rascal AI -profiili organisaation riviltä (public.users). */
export async function loadBrandContext(orgId: string): Promise<BrandContext> {
  const { data } = await createAdminClient()
    .from("users")
    .select(
      "company_name, company_website_url, industry, content_language, company_summary, icp_summary, buyer_persona, tov, voice_anchor",
    )
    .eq("id", orgId)
    .maybeSingle();

  return {
    companyName: data?.company_name ?? null,
    website: data?.company_website_url ?? null,
    industry: data?.industry ?? null,
    language: data?.content_language ?? null,
    companySummary: data?.company_summary ?? null,
    icpSummary: data?.icp_summary ?? null,
    buyerPersona: data?.buyer_persona ?? null,
    tov: data?.tov ?? null,
    voiceAnchor: data?.voice_anchor ?? null,
  };
}
