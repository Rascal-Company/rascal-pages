"use server";

import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/src/utils/supabase/server";
import { nanoid } from "nanoid";
import { createSiteId, type SiteId } from "@/src/lib/types";
import {
  createOverlayVariantId,
  parseChanges,
  parseMatch,
  parseTargetUrl,
  subdomainFromOrigin,
  type OverlayVariantId,
} from "@/src/lib/overlay";

type ActionResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: string };

async function getOrgId(client: SupabaseClient): Promise<string | null> {
  const {
    data: { user },
  } = await client.auth.getUser();
  if (!user) return null;

  const { data: orgMember } = await client
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  return orgMember?.org_id ?? null;
}

/** Varmistaa, että variantin sivusto kuuluu organisaatiolle. Palauttaa site_id:n. */
async function verifyVariantOwnership(
  client: SupabaseClient,
  variantId: OverlayVariantId,
  orgId: string,
): Promise<string | null> {
  const { data } = await client
    .from("overlay_variants")
    .select("site_id, sites!inner(user_id)")
    .eq("id", variantId)
    .maybeSingle();

  const site = data?.sites as unknown as { user_id: string } | undefined;
  if (!data || site?.user_id !== orgId) return null;
  return data.site_id as string;
}

export async function createOverlayVariantCore(
  client: SupabaseClient,
  orgId: string,
  siteId: SiteId,
  input: { name: string; targetUrl: string },
): Promise<ActionResult<{ id: OverlayVariantId }>> {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Anna variantille nimi." };

  const target = parseTargetUrl(input.targetUrl);
  if (!target) {
    return { success: false, error: "Anna kelvollinen sivun osoite, esim. https://asiakas.fi/hinnasto." };
  }

  const { data: site } = await client
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", orgId)
    .maybeSingle();
  if (!site) {
    return { success: false, error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia." };
  }

  const { data, error } = await client
    .from("overlay_variants")
    .insert({
      site_id: siteId,
      name: name.slice(0, 120),
      target_origin: target.origin,
      path_pattern: target.path,
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("Create overlay variant error:", error);
    return { success: false, error: "Variantin luonti epäonnistui." };
  }

  return { success: true, data: { id: createOverlayVariantId(data.id) } };
}

export type SaveOverlayVariantInput = {
  name: string;
  pathPattern: string;
  match: unknown;
  changes: unknown;
  active: boolean;
};

export async function saveOverlayVariantCore(
  client: SupabaseClient,
  orgId: string,
  variantId: OverlayVariantId,
  input: SaveOverlayVariantInput,
): Promise<ActionResult> {
  const siteId = await verifyVariantOwnership(client, variantId, orgId);
  if (!siteId) {
    return { success: false, error: "Varianttia ei löydy tai sinulla ei ole oikeuksia." };
  }

  const name = input.name.trim();
  if (!name) return { success: false, error: "Anna variantille nimi." };

  const pathPattern = input.pathPattern.trim() || "/";
  if (!/^(\*|\/[^\s]*)$/.test(pathPattern)) {
    return { success: false, error: "Polun pitää alkaa /-merkillä (tai olla *)." };
  }

  const parsed = parseChanges(input.changes);
  if (!parsed.ok) return { success: false, error: parsed.error };

  const { error } = await client
    .from("overlay_variants")
    .update({
      name: name.slice(0, 120),
      path_pattern: pathPattern.slice(0, 500),
      match: parseMatch(input.match),
      changes: parsed.changes,
      active: input.active === true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", variantId);

  if (error) {
    console.error("Save overlay variant error:", error);
    return { success: false, error: "Tallennus epäonnistui." };
  }

  revalidatePath(`/app/dashboard/${siteId}/overlay`);
  return { success: true };
}

/**
 * "Uusi sivusto → Overlay": luo sivuston asiakkaan domainista johdetulla
 * subdomainilla ja sille ensimmäisen variantin. Palauttaa editorin osoitteen.
 */
export async function createOverlaySite(input: {
  targetUrl: string;
}): Promise<ActionResult<{ siteId: SiteId; variantId: OverlayVariantId }>> {
  const client = await createClient();
  const orgId = await getOrgId(client);
  if (!orgId) return { success: false, error: "Kirjaudu sisään." };

  const target = parseTargetUrl(input.targetUrl);
  if (!target) {
    return { success: false, error: "Anna kelvollinen sivun osoite, esim. https://asiakas.fi." };
  }

  // Subdomain on uniikki: kokeillaan perusnimeä ja tarvittaessa satunnaista päätettä.
  const base = subdomainFromOrigin(target.origin);
  const suffix = () => nanoid(4).toLowerCase().replace(/[^a-z0-9]/g, "x");
  const candidates = [base, ...Array.from({ length: 3 }, () => `${base}${suffix()}`)];

  let siteId: SiteId | null = null;
  for (const subdomain of candidates) {
    const { data, error } = await client
      .from("sites")
      .insert({ user_id: orgId, subdomain, custom_domain: null, settings: {} })
      .select("id")
      .single();
    if (data) {
      siteId = createSiteId(data.id);
      break;
    }
    if (error?.code !== "23505") {
      console.error("Create overlay site error:", error);
      return { success: false, error: "Sivuston luonti epäonnistui." };
    }
  }
  if (!siteId) return { success: false, error: "Sivuston luonti epäonnistui." };

  const variant = await createOverlayVariantCore(client, orgId, siteId, {
    name: "Variantti 1",
    targetUrl: input.targetUrl,
  });
  if (!variant.success) return variant;

  revalidatePath("/app/dashboard");
  return { success: true, data: { siteId, variantId: variant.data.id } };
}

export async function createOverlayVariant(
  siteId: SiteId,
  input: { name: string; targetUrl: string },
): Promise<ActionResult<{ id: OverlayVariantId }>> {
  const client = await createClient();
  const orgId = await getOrgId(client);
  if (!orgId) return { success: false, error: "Kirjaudu sisään." };
  return createOverlayVariantCore(client, orgId, siteId, input);
}

export async function saveOverlayVariant(
  variantId: OverlayVariantId,
  input: SaveOverlayVariantInput,
): Promise<ActionResult> {
  const client = await createClient();
  const orgId = await getOrgId(client);
  if (!orgId) return { success: false, error: "Kirjaudu sisään." };
  return saveOverlayVariantCore(client, orgId, variantId, input);
}

export async function deleteOverlayVariant(
  variantId: OverlayVariantId,
): Promise<ActionResult> {
  const client = await createClient();
  const orgId = await getOrgId(client);
  if (!orgId) return { success: false, error: "Kirjaudu sisään." };

  const siteId = await verifyVariantOwnership(client, variantId, orgId);
  if (!siteId) {
    return { success: false, error: "Varianttia ei löydy tai sinulla ei ole oikeuksia." };
  }

  const { error } = await client.from("overlay_variants").delete().eq("id", variantId);
  if (error) {
    console.error("Delete overlay variant error:", error);
    return { success: false, error: "Poisto epäonnistui." };
  }

  revalidatePath(`/app/dashboard/${siteId}/overlay`);
  return { success: true };
}
