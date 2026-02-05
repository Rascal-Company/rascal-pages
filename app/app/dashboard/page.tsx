import { createClient } from "@/src/utils/supabase/server";
import { redirect } from "next/navigation";
import DashboardClient from "@/app/components/DashboardClient";
import { getHomeUrl } from "@/app/lib/navigation";

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

  // 5. Hae jokaisen sivuston 'home' sivun julkaisutila
  const sitesWithPublishedStatus = await Promise.all(
    (sites || []).map(async (site) => {
      const { data: page } = await supabase
        .from("pages")
        .select("published")
        .eq("site_id", site.id)
        .eq("slug", "home")
        .maybeSingle();

      return {
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

  return (
    <DashboardClient initialSites={sitesWithPublishedStatus} userId={user.id} />
  );
}
