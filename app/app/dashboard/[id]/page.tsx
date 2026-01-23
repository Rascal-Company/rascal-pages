import { createClient } from "@/src/utils/supabase/server";
import { redirect } from "next/navigation";
import Editor from "@/app/components/editor/Editor";

// Estetään pre-rendering build-aikana, koska sivu vaatii käyttäjäsession
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function SiteEditorPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Tarkista käyttäjä
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Älä ohjaa kovakoodattuun HTTPS-osoitteeseen, vaan suhteelliseen polkuun
    // Tämä pitää sinut localhostissa kehityksen aikana
    redirect("/");
  }

  // 2. Hae käyttäjän organisaatio
  const { data: orgMember, error: orgMemberError } = await supabase
    .from("org_members")
    .select("org_id, role")
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

  // 4. Hae sivuston 'home' sivu tai luo oletusrakenne
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", id)
    .eq("slug", "home")
    .maybeSingle();

  // Oletussisältö jos sivua ei ole - käytä oletustemplatea
  const { getDefaultTemplate } = await import("@/src/lib/templates");
  const defaultTemplate = getDefaultTemplate();
  const defaultContent = defaultTemplate.defaultContent;

  // Jos sivulla on sisältö, käytä sitä. Muuten käytä oletustemplatea.
  const pageContent = page?.content || defaultContent;
  const pageId = page?.id || null;
  const initialPublished = page?.published ?? false;

  return (
    <Editor
      siteId={id}
      pageId={pageId}
      siteSubdomain={site.subdomain}
      initialContent={pageContent}
      initialPublished={initialPublished}
    />
  );
}
