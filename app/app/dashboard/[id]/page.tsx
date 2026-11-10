import { createClient } from "@/src/utils/supabase/server";
import { redirect } from "next/navigation";
import Editor from "./EditorClient";
import { createSiteId } from "@/src/lib/types";
import { getHomeUrl } from "@/app/lib/navigation";
import { getActiveOrgMember } from "@/src/lib/active-org";
import { editableContent, pageHasUnpublishedChanges } from "@/src/lib/draft-publish";
import type { TemplateConfig } from "@/src/lib/templates";

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
  const orgMember = await getActiveOrgMember(supabase, user.id);

  if (!orgMember) {
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
    .select("*, page_drafts(content)")
    .eq("site_id", id)
    .eq("slug", pageSlug)
    .maybeSingle();

  // Alasivun pitää olla olemassa; 'home' luodaan ensimmäisellä tallennuksella.
  if (!page && pageSlug !== "home") {
    redirect(`/app/dashboard/${id}/pages`);
  }

  // Oletussisältö jos sivua ei ole - käytä oletustemplatea
  const { getDefaultTemplate } = await import("@/src/lib/templates");
  const defaultTemplate = getDefaultTemplate();
  const defaultContent = defaultTemplate.defaultContent;

  // Editori muokkaa luonnosta, jos sellainen on; muuten live-sisältöä tai oletusta.
  const draftRows = page?.page_drafts as { content: unknown } | { content: unknown }[] | null | undefined;
  const draftContent = (Array.isArray(draftRows) ? draftRows[0] : draftRows)?.content ?? null;
  const pageContent =
    (page
      ? (editableContent({ content: page.content, draft_content: draftContent }) as
          | TemplateConfig
          | Record<string, unknown>
          | null)
      : null) || defaultContent;
  const hasUnpublishedChanges = page
    ? pageHasUnpublishedChanges({ published: page.published, content: page.content, draft_content: draftContent })
    : false;
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
      initialHasUnpublishedChanges={hasUnpublishedChanges}
      crmEnabled={crmEnabled}
    />
  );
}
