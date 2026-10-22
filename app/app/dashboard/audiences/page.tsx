import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { loadOrgContext, loadProfiles } from "../[id]/overlay/overlay-data";
import ProfilesClient, { type ProfileUsage } from "./ProfilesClient";

export const dynamic = "force-dynamic";

type LandingPageRow = {
  id: string;
  name: string;
  profile_id: string;
  overlay_campaigns: { id: string; name: string; site_id: string; sites: { user_id: string } };
};

/**
 * Kohderyhmät: organisaation yhteiset profiilit, joille overlay-kampanjoiden
 * laskeutumissivut kirjoitetaan. Näkyy dashboardilla, koska sama ryhmä on
 * käytössä kaikilla sivuilla ja mainoksissa.
 */
export default async function AudiencesPage() {
  const { supabase, orgId } = await loadOrgContext();

  const [profiles, { data: landingPages }, { data: segments }] = await Promise.all([
    loadProfiles(supabase, orgId),
    supabase
      .from("overlay_landing_pages")
      .select("id, name, profile_id, overlay_campaigns!inner(id, name, site_id, sites!inner(user_id))")
      .not("profile_id", "is", null),
    // CRM-segmentit (Rascal CRM) tuotaviksi profiileiksi. Service-rolella, koska
    // organisaatio on jo tarkistettu.
    createAdminClient()
      .from("contact_segments")
      .select("id, name, total_contacts")
      .eq("user_id", orgId)
      .order("name"),
  ]);

  const usage: Record<string, ProfileUsage[]> = {};
  for (const lp of (landingPages ?? []) as unknown as LandingPageRow[]) {
    const campaign = lp.overlay_campaigns;
    if (campaign.sites.user_id !== orgId) continue;
    (usage[lp.profile_id] ??= []).push({
      id: lp.id,
      label: `${campaign.name} · ${lp.name}`,
      href: `/app/dashboard/${campaign.site_id}/overlay/${campaign.id}/${lp.id}`,
    });
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/app/dashboard"
          className="-ml-1 mb-6 inline-flex items-center gap-0.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Sivustot
        </Link>
        <h1 className="text-3xl font-bold leading-tight tracking-tight">Kohderyhmät</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Yhteiset kaikille sivuille ja kampanjoille. AI kirjoittaa laskeutumissivujen variaatiot
          valitun kohderyhmän pohjalta.
        </p>
        <div className="mt-8">
          <ProfilesClient
            initialProfiles={profiles}
            usage={usage}
            crmSegments={(segments ?? []).map((s) => ({
              id: s.id as string,
              name: (s.name as string) ?? "",
              totalContacts: (s.total_contacts as number) ?? 0,
            }))}
          />
        </div>
      </div>
    </div>
  );
}
