"use server";

import { createClient } from "@/src/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { slugify } from "@/src/lib/posts";
import { RESERVED_PAGE_SLUGS } from "@/src/lib/site-nav";
import { getTemplateById, getDefaultTemplate } from "@/src/lib/templates";

export type CreatePageInput = {
  title: string;
  slug?: string;
  templateId?: string;
};

type CreateResult =
  | { success: true; slug: string }
  | { success: false; error: string };

type MutateResult = { success: true } | { success: false; error: string };

async function resolveOrgId(
  supabase: SupabaseClient,
): Promise<{ orgId: string } | { error: string }> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return { error: "Sinun täytyy olla kirjautunut sisään." };
  }

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember) return { error: "Käyttäjätiliä ei löydy." };
  return { orgId: orgMember.org_id };
}

async function assertSiteOwnership(
  client: SupabaseClient,
  siteId: string,
  orgId: string,
): Promise<boolean> {
  const { data } = await client
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", orgId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Create a new subpage for a site. The slug is derived from the title (or an
 * explicit slug), validated against reserved names, and the page is seeded with
 * the chosen template's default content. New pages start unpublished.
 */
export async function createPage(
  siteId: string,
  input: CreatePageInput,
): Promise<CreateResult> {
  const supabase = await createClient();
  const org = await resolveOrgId(supabase);
  if ("error" in org) return { success: false, error: org.error };

  if (!(await assertSiteOwnership(supabase, siteId, org.orgId))) {
    return { success: false, error: "Sivustoa ei löydy tai ei oikeuksia." };
  }

  const title = input.title.trim();
  if (!title) return { success: false, error: "Otsikko on pakollinen." };

  const slug = slugify(input.slug || title);
  if (!slug) {
    return { success: false, error: "Slug ei kelpaa. Käytä kirjaimia ja numeroita." };
  }
  if (RESERVED_PAGE_SLUGS.includes(slug)) {
    return { success: false, error: `Slug "${slug}" on varattu.` };
  }

  const template =
    (input.templateId ? getTemplateById(input.templateId) : undefined) ??
    getDefaultTemplate();
  const content = {
    ...template.defaultContent,
    templateId: template.id,
  };

  const { error } = await supabase.from("pages").insert({
    site_id: siteId,
    slug,
    title,
    content,
    published: false,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "Tämä slug on jo käytössä." };
    }
    console.error("Virhe sivun luonnissa:", error);
    return { success: false, error: "Sivun luonti epäonnistui." };
  }

  revalidatePath(`/app/dashboard/${siteId}/pages`);
  return { success: true, slug };
}

/**
 * Delete a subpage by slug. The home page cannot be deleted.
 */
export async function deletePage(
  siteId: string,
  slug: string,
): Promise<MutateResult> {
  if (slug === "home") {
    return { success: false, error: "Etusivua ei voi poistaa." };
  }

  const supabase = await createClient();
  const org = await resolveOrgId(supabase);
  if ("error" in org) return { success: false, error: org.error };

  if (!(await assertSiteOwnership(supabase, siteId, org.orgId))) {
    return { success: false, error: "Sivustoa ei löydy tai ei oikeuksia." };
  }

  const { error } = await supabase
    .from("pages")
    .delete()
    .eq("site_id", siteId)
    .eq("slug", slug);

  if (error) {
    console.error("Virhe sivun poistossa:", error);
    return { success: false, error: "Sivun poisto epäonnistui." };
  }

  revalidatePath(`/app/dashboard/${siteId}/pages`);
  return { success: true };
}
