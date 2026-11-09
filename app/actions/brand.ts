"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/utils/supabase/server";
import { resolveActiveOrg, type OrgId } from "@/src/lib/active-org";

export type BrandOption = {
  id: OrgId;
  name: string;
  logoUrl: string | null;
};

export type BrandContext = {
  activeOrgId: OrgId;
  brands: BrandOption[];
};

/**
 * Käyttäjän brändit (org_members-jäsenyydet) ja niistä aktiivinen. Tilivalikko
 * näyttää vaihtimen, kun brändejä on useampi kuin yksi.
 */
export async function getBrandContext(): Promise<BrandContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const active = await resolveActiveOrg(supabase, user.id);
  if (!active) return null;

  const ids = active.memberships.map((m) => m.org_id);
  const { data: orgs } = await supabase
    .from("users")
    .select("id, company_name, logo_url")
    .in("id", ids);
  const byId = new Map((orgs ?? []).map((o) => [o.id as string, o]));

  const brands = ids
    .map((id) => ({
      id,
      name: (byId.get(id)?.company_name as string | null) || "Nimetön brändi",
      logoUrl: (byId.get(id)?.logo_url as string | null) ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "fi"));

  return { activeOrgId: active.orgId, brands };
}

/**
 * Vaihtaa aktiivisen brändin. Kirjoittaa saman user_active_org-rivin kuin
 * Rascal AI, joten valinta seuraa tuotteesta toiseen. RLS sallii rivin vain
 * orgiin, jonka aktiivinen jäsen käyttäjä on; jäsenyys tarkistetaan myös tässä.
 */
export async function switchBrand(
  orgId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Sinun täytyy olla kirjautunut sisään." };

  const { data: membership } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .eq("org_id", orgId)
    .eq("active", true)
    .maybeSingle();
  if (!membership) return { success: false, error: "Et ole tämän brändin jäsen." };

  const { error } = await supabase
    .from("user_active_org")
    .upsert(
      { auth_user_id: user.id, org_id: orgId, updated_at: new Date().toISOString() },
      { onConflict: "auth_user_id" },
    );
  if (error) {
    console.error("[switchBrand] upsert failed:", error.message);
    return { success: false, error: "Brändin vaihto epäonnistui." };
  }

  revalidatePath("/app/dashboard", "layout");
  return { success: true };
}
