import { createClient } from "@/src/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "@/app/components/DashboardClient";
import { getHomeUrl } from "@/app/lib/navigation";
import { loadSiteKpis } from "./site-kpis";
import { siteKind } from "@/src/lib/site-kind";

// Estetään pre-rendering build-aikana, koska sivu vaatii käyttäjäsession
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // 1. Luo client palvelimella
  const supabase = await createClient();

  // 2. Tarkista käyttäjä
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Redirect to home page (root domain) for login
    redirect(getHomeUrl());
  }

  // 3. Hae käyttäjän organisaatio org_members taulusta
  const { data: orgMember, error: orgMemberError } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember || orgMemberError) {
    return <div>Virhe: Organisaatiota ei löydy.</div>;
  }

  // 4. Hae sivustot käyttäen org_id:ta (public.users.id)
  const { data: sites, error } = await supabase
    .from("sites")
    .select("*")
    .eq("user_id", orgMember.org_id)
    .order("created_at", { ascending: false });

  if (error) {
    return <div>Virhe ladatessa sivustoja: {error.message}</div>;
  }

  // 5. Overlay-kampanjat ryhmittelyä varten (lander / portfolio / overlay)
  const siteIds = (sites || []).map((site) => site.id);
  const { data: campaigns } = siteIds.length
    ? await supabase
        .from("overlay_campaigns")
        .select("site_id, target_origin")
        .in("site_id", siteIds)
    : { data: [] };

  // Blogi tekee sivustosta kokonaisen sivuston (portfolio-ryhmä).
  const { data: posts } = siteIds.length
    ? await supabase.from("posts").select("site_id").in("site_id", siteIds)
    : { data: [] };

  // 6. Hae jokaisen sivuston 'home' sivun julkaisutila
  const sitesWithPublishedStatus = await Promise.all(
    (sites || []).map(async (site) => {
      const { data: page } = await supabase
        .from("pages")
        .select("published, templateId:content->>templateId")
        .eq("site_id", site.id)
        .eq("slug", "home")
        .maybeSingle();

      const siteCampaigns = (campaigns ?? []).filter((c) => c.site_id === site.id);

      return {
        kind: siteKind({
          hasHomePage: Boolean(page),
          templateId: (page?.templateId as string | null) ?? null,
          campaignCount: siteCampaigns.length,
          postCount: (posts ?? []).filter((post) => post.site_id === site.id).length,
        }),
        campaignCount: siteCampaigns.length,
        overlayOrigin: siteCampaigns[0]?.target_origin ?? null,
        id: site.id,
        user_id: site.user_id,
        subdomain: site.subdomain,
        custom_domain: site.custom_domain,
        settings: site.settings as Record<string, unknown>,
        published: page?.published ?? false,
        created_at:
          site.created_at instanceof Date
            ? site.created_at.toISOString()
            : String(site.created_at),
        updated_at:
          site.updated_at instanceof Date
            ? site.updated_at.toISOString()
            : String(site.updated_at),
      };
    }),
  );

  // 7. Tunnusluvut (30 pv + vertailujakso) rinnakkain
  const sitesWithKpis = await Promise.all(
    sitesWithPublishedStatus.map(async (site) => ({
      ...site,
      kpis: await loadSiteKpis(supabase, {
        id: site.id,
        kind: site.kind === "overlay" ? "overlay" : "lander",
      }),
    })),
  );

  return <DashboardClient initialSites={sitesWithKpis} userId={user.id} />;
}
