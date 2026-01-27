import { createClient } from "@/src/utils/supabase/server";
import { redirect } from "next/navigation";
import SettingsClient from "./SettingsClient";
import { createSiteId } from "@/src/lib/types";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SettingsPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Tarkista käyttäjä
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/");
  }

  // 2. Hae käyttäjän organisaatio
  const { data: orgMember, error: orgMemberError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember || orgMemberError) {
    return <div>Virhe: Organisaatiota ei löydy.</div>;
  }

  // 3. Hae sivuston tiedot
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .eq("id", id)
    .eq("user_id", orgMember.org_id)
    .single();

  if (siteError || !site) {
    redirect("/app/dashboard");
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi";

  // Hae analytiikka-asetukset settings-kentästä
  const siteSettings = (site.settings as Record<string, unknown>) || {};
  const initialSettings = {
    googleTagManagerId: (siteSettings.googleTagManagerId as string) || "",
    metaPixelId: (siteSettings.metaPixelId as string) || "",
  };

  return (
    <SettingsClient
      siteId={createSiteId(id)}
      subdomain={site.subdomain}
      rootDomain={rootDomain}
      initialSettings={initialSettings}
    />
  );
}
