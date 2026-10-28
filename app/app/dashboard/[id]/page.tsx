import { createClient } from "@/src/utils/supabase/server";
import { redirect } from "next/navigation";
import Editor from "./EditorClient";
import { createSiteId } from "@/src/lib/types";
import { getHomeUrl } from "@/app/lib/navigation";
import { allowedTemplateList, defaultTemplateIdFor } from "@/src/lib/entitlements";
import { getSiteEntitlements } from "@/src/lib/site-plan-server";

// Estetään pre-rendering build-aikana, koska sivu vaatii käyttäjäsession
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}

export default async function SiteEditorPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const pageSlug = pageParam?.trim() || "home";
  const supabase = await createClient();

  // 1. Tarkista käyttäjä
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Redirect to home page (root domain) for login
    redirect(getHomeUrl());
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

  // 2b. Tarkista onko organisaatiolla rascal-crm käytössä
  const { data: crmProduct } = await supabase
    .from("organization_products")
    .select("id, products!inner(slug)")
    .eq("org_id", orgMember.org_id)
    .eq("is_enabled", true)
    .eq("products.slug", "rascal-crm")
    .maybeSingle();

  const crmEnabled = Boolean(crmProduct);

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

  // 4. Hae muokattava sivu (oletus 'home', tai ?page=<slug> alasivulle)
  const { data: page } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", id)
    .eq("slug", pageSlug)
    .maybeSingle();

  // Alasivun pitää olla olemassa; 'home' luodaan ensimmäisellä tallennuksella.
  if (!page && pageSlug !== "home") {
    redirect(`/app/dashboard/${id}/pages`);
  }

  // Paketin oikeudet: lukitut pohjat ja oletuspohja (RAS-1169). Virheessä
  // editori näyttää kaikki pohjat; julkaisu tarkistetaan silti palvelimella.
  const entitlements = await getSiteEntitlements(id, orgMember.org_id).catch((error) => {
    console.error("Pakettioikeuksien haku epäonnistui:", error);
    return null;
  });
  const allowedTemplateIds = entitlements ? allowedTemplateList(entitlements) : null;

  // Oletussisältö jos sivua ei ole - käytä oletustemplatea
  const { getDefaultTemplate, getTemplateById } = await import("@/src/lib/templates");
  const preferredTemplate = getDefaultTemplate();
  const defaultTemplate = entitlements
    ? (getTemplateById(defaultTemplateIdFor(entitlements, preferredTemplate.id)) ?? preferredTemplate)
    : preferredTemplate;
  const defaultContent = defaultTemplate.defaultContent;

  // Jos sivulla on sisältö, käytä sitä. Muuten käytä oletustemplatea.
  const pageContent = page?.content || defaultContent;
  const pageId = page?.id || null;
  const initialPublished = page?.published ?? false;
  const pageTitle = page?.title || "Etusivu";

  return (
    <Editor
      siteId={createSiteId(id)}
      pageId={pageId}
      pageSlug={pageSlug}
      pageTitle={pageTitle}
      siteSubdomain={site.subdomain}
      siteCustomDomain={site.custom_domain ?? null}
      initialContent={pageContent}
      initialPublished={initialPublished}
      crmEnabled={crmEnabled}
      allowedTemplateIds={allowedTemplateIds}
    />
  );
}
