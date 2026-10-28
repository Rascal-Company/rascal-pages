"use server";

import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { createClient } from "@/src/utils/supabase/server";
import { loadBrandContext } from "@/src/lib/brand-context";
import { RateLimiter } from "@/src/lib/rate-limit";
import { DRAFT_LIMIT_MESSAGE } from "@/src/lib/entitlements";
import { canOrgCreateSite } from "@/src/lib/site-plan-server";
import { generateReferencePage } from "@/src/lib/reference-ai";
import { fetchReferenceSkeleton } from "@/src/lib/reference-fetch";
import type { ReferenceMode } from "@/src/lib/reference-page";

export type CreateReferenceSiteInput = {
  subdomain: string;
  urls: string[];
  mode: ReferenceMode;
  goal: string;
};

export type CreateReferenceSiteResult =
  | { success: true; siteId: string; styleSummary: string; skipped: { url: string; error: string }[] }
  | { success: false; error: string };

const MAX_REFERENCES = 3;
/** Generointi on raskas: rajoitetaan organisaatiota kohden. */
const limiter = new RateLimiter({ maxRequests: 10, windowMs: 60 * 60 * 1000 });

/**
 * Luo sivuston, jonka etusivu tehdään referenssisivujen pohjalta (RAS-624).
 * Subdomain tarkistetaan ennen hakua ja generointia, jotta käyttäjä ei odota turhaan.
 */
export async function createReferenceSite(input: CreateReferenceSiteInput): Promise<CreateReferenceSiteResult> {
  const subdomain = input.subdomain.trim().toLowerCase();
  if (!/^[a-z0-9]+$/.test(subdomain)) {
    return { success: false, error: "Subdomain voi sisältää vain kirjaimia ja numeroita." };
  }
  const urls = [...new Set(input.urls.map((u) => u.trim()).filter(Boolean))].slice(0, MAX_REFERENCES);
  if (urls.length === 0) return { success: false, error: "Anna vähintään yksi referenssisivu." };
  const mode: ReferenceMode = input.mode === "own" ? "own" : "inspiration";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Kirjaudu sisään luodaksesi sivuston." };

  const { data: orgMember } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!orgMember) return { success: false, error: "Käyttäjätiliä ei löydy. Ota yhteyttä tukeen." };
  const orgId = orgMember.org_id as string;
  if (!(await canOrgCreateSite(orgId))) return { success: false, error: DRAFT_LIMIT_MESSAGE };

  const { data: existing } = await supabase.from("sites").select("id").eq("subdomain", subdomain).limit(1);
  if (existing && existing.length > 0) return { success: false, error: "Tämä subdomain on jo käytössä." };

  if (!limiter.check(orgId).allowed) {
    return { success: false, error: "Liian monta generointia. Yritä myöhemmin uudelleen." };
  }

  const fetched = await Promise.all(urls.map(fetchReferenceSkeleton));
  const skeletons = fetched.flatMap((r) => (r.ok ? [r.skeleton] : []));
  const skipped = fetched.flatMap((r) => (r.ok ? [] : [{ url: r.url, error: r.error }]));
  if (skeletons.length === 0) {
    return { success: false, error: skipped.map((s) => `${s.url}: ${s.error}`).join(" ") };
  }

  const brand = await loadBrandContext(orgId);
  const page = await generateReferencePage(brand, { mode, goal: input.goal.slice(0, 2000) }, skeletons, () => nanoid(10));
  if (!page.ok) return { success: false, error: page.error };

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({ user_id: orgId, subdomain, custom_domain: null, settings: {} })
    .select("id")
    .single();
  if (siteError || !site) {
    // Kilpailutilanne: joku ehti varata subdomainin generoinnin aikana.
    if (siteError?.code === "23505") return { success: false, error: "Tämä subdomain ehdittiin ottaa käyttöön. Valitse toinen." };
    console.error("Virhe sivuston luonnissa:", siteError);
    return { success: false, error: "Sivuston luominen epäonnistui. Yritä uudelleen." };
  }

  const { error: pageError } = await supabase.from("pages").insert({
    site_id: site.id,
    slug: "home",
    title: page.siteTitle || "Etusivu",
    content: page.content,
    published: false,
  });
  if (pageError) {
    console.error("Virhe sivun tallennuksessa:", pageError);
    await supabase.from("sites").delete().eq("id", site.id);
    return { success: false, error: "Sivun tallennus epäonnistui. Yritä uudelleen." };
  }

  revalidatePath("/app/dashboard");
  return { success: true, siteId: site.id as string, styleSummary: page.styleSummary, skipped };
}
