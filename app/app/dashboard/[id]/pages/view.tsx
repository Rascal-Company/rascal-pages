import { createClient } from "@/src/utils/supabase/server";
import { redirect } from "next/navigation";
import { getHomeUrl } from "@/app/lib/navigation";
import PagesClient, { type PageListItem } from "./PagesClient";
import { getDefaultTemplate } from "@/src/lib/templates";
import { allowedTemplateList, defaultTemplateIdFor } from "@/src/lib/entitlements";
import { getSiteEntitlements } from "@/src/lib/site-plan-server";


/** Sisältö sekä editorin päälle avautuvaan ikkunaan että erilliselle sivulle. */
export default async function SitePagesView({ siteId: id }: { siteId: string }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(getHomeUrl());
  }

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember) {
    return <div>Virhe: Organisaatiota ei löydy.</div>;
  }

  const { data: site } = await supabase
    .from("sites")
    .select("id, subdomain, custom_domain")
    .eq("id", id)
    .eq("user_id", orgMember.org_id)
    .single();

  if (!site) {
    redirect("/app/dashboard");
  }

  const { data: rows } = await supabase
    .from("pages")
    .select("slug, title, published, updated_at")
    .eq("site_id", id)
    .order("created_at", { ascending: true });

  const pages = (rows ?? []) as PageListItem[];

  // Lukitut pohjat (RAS-1169); virheessä näytetään kaikki, palvelin tarkistaa silti.
  const entitlements = await getSiteEntitlements(site.id, orgMember.org_id).catch(() => null);
  const allowedTemplateIds = entitlements ? allowedTemplateList(entitlements) : null;
  const defaultTemplateId = entitlements
    ? defaultTemplateIdFor(entitlements, getDefaultTemplate().id)
    : getDefaultTemplate().id;

  return (
    <PagesClient
      siteId={site.id}
      subdomain={site.subdomain}
      pages={pages}
      allowedTemplateIds={allowedTemplateIds}
      defaultTemplateId={defaultTemplateId}
    />
  );
}
