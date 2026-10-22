"use server";

import { loadBrandContext } from "@/src/lib/brand-context";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/src/utils/supabase/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { nanoid } from "nanoid";
import { createSiteId, isValidUuid, type SiteId } from "@/src/lib/types";
import { RateLimiter } from "@/src/lib/rate-limit";
import {
  createOverlayVariantId,
  createRpCode,
  parseMatch,
  parseTargetUrl,
  subdomainFromOrigin,
  type OverlayMatch,
  type OverlayVariantId,
} from "@/src/lib/overlay";
import {
  buildChanges,
  createOverlayCampaignId,
  createOverlayLandingPageId,
  createOverlayProfileId,
  parseSlots,
  parseSlotValues,
  type OverlayCampaignId,
  type OverlayLandingPageId,
  type OverlayProfileId,
  type OverlaySlot,
  type OverlaySlotValues,
} from "@/src/lib/overlay-campaign";
import { generateVariantCopy } from "@/src/lib/overlay-ai";
import { createPreviewToken, previewSecret } from "@/src/lib/overlay-token";
import { pagesSiteOrigins } from "@/src/lib/overlay-pages";
import { describeProfileData } from "@/src/lib/overlay-profile";

type ActionResult<T = undefined> =
  | ({ success: true } & (T extends undefined ? object : { data: T }))
  | { success: false; error: string };

export type OverlayVariation = {
  id: OverlayVariantId;
  name: string;
  prompt: string;
  values: OverlaySlotValues;
  active: boolean;
  previewToken: string;
};

export type OverlayProfile = {
  id: OverlayProfileId;
  name: string;
  description: string;
  source: "custom" | "rascal_ai" | "crm_segment";
};

type CampaignRow = {
  id: string;
  site_id: string;
  name: string;
  target_origin: string;
};

type LandingPageRow = {
  id: string;
  campaign_id: string;
  path_pattern: string;
  profile_id: string | null;
  slots: OverlaySlot[];
  campaign: CampaignRow;
};

const NO_ACCESS = "Kohdetta ei löydy tai sinulla ei ole oikeuksia.";
const SIGN_IN = "Kirjaudu sisään.";

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

async function session(): Promise<{ client: SupabaseClient; orgId: string } | null> {
  const client = await createClient();
  const orgId = await getOrgId(client);
  return orgId ? { client, orgId } : null;
}

async function getOwnedCampaign(
  client: SupabaseClient,
  campaignId: OverlayCampaignId,
  orgId: string,
): Promise<CampaignRow | null> {
  const { data } = await client
    .from("overlay_campaigns")
    .select("id, site_id, name, target_origin, sites!inner(user_id)")
    .eq("id", campaignId)
    .maybeSingle();

  const site = data?.sites as unknown as { user_id: string } | undefined;
  if (!data || site?.user_id !== orgId) return null;
  return data as unknown as CampaignRow;
}

async function getOwnedLandingPage(
  client: SupabaseClient,
  landingPageId: OverlayLandingPageId,
  orgId: string,
): Promise<LandingPageRow | null> {
  const { data } = await client
    .from("overlay_landing_pages")
    .select("id, campaign_id, path_pattern, profile_id, slots")
    .eq("id", landingPageId)
    .maybeSingle();
  if (!data) return null;

  const campaign = await getOwnedCampaign(
    client,
    createOverlayCampaignId(data.campaign_id),
    orgId,
  );
  return campaign ? ({ ...data, campaign } as LandingPageRow) : null;
}

async function getOwnedVariantLandingPage(
  client: SupabaseClient,
  variantId: OverlayVariantId,
  orgId: string,
): Promise<LandingPageRow | null> {
  const { data } = await client
    .from("overlay_variants")
    .select("landing_page_id")
    .eq("id", variantId)
    .maybeSingle();
  if (!data?.landing_page_id) return null;
  return getOwnedLandingPage(client, createOverlayLandingPageId(data.landing_page_id), orgId);
}

function revalidateOverlay(siteId: string) {
  revalidatePath(`/app/dashboard/${siteId}/overlay`, "layout");
}

function validPath(input: string): string | null {
  const path = input.trim() || "/";
  return /^(\*|\/[^\s]*)$/.test(path) ? path.slice(0, 500) : null;
}

// ---- Variaatiot ----------------------------------------------------------------

const VARIANT_COLUMNS = "id, name, prompt, slot_values, active";

function toVariation(row: {
  id: string;
  name: string;
  prompt: string;
  slot_values: unknown;
  active: boolean;
}): OverlayVariation {
  const id = createOverlayVariantId(row.id);
  return {
    id,
    name: row.name,
    prompt: row.prompt,
    values: (row.slot_values ?? {}) as OverlaySlotValues,
    active: row.active,
    previewToken: createPreviewToken(id, previewSecret()),
  };
}

async function insertVariant(
  client: SupabaseClient,
  landingPage: Pick<LandingPageRow, "id" | "path_pattern" | "campaign">,
  input: { name: string; prompt?: string; values?: OverlaySlotValues },
): Promise<ActionResult<OverlayVariation>> {
  const name = input.name.trim().slice(0, 120);
  if (!name) return { success: false, error: "Anna variaatiolle nimi." };

  const { data, error } = await client
    .from("overlay_variants")
    .insert({
      landing_page_id: landingPage.id,
      site_id: landingPage.campaign.site_id,
      name,
      prompt: (input.prompt ?? "").trim().slice(0, 2000),
      slot_values: input.values ?? {},
      // Vanhat sarakkeet (NOT NULL) täytetään, kunnes ne poistetaan.
      target_origin: landingPage.campaign.target_origin,
      path_pattern: landingPage.path_pattern,
    })
    .select(VARIANT_COLUMNS)
    .single();

  if (error || !data) {
    console.error("Create overlay variant error:", error);
    return { success: false, error: "Variaation luonti epäonnistui." };
  }
  return { success: true, data: toVariation(data) };
}

export async function createOverlayVariant(
  landingPageId: OverlayLandingPageId,
  input: { name: string },
): Promise<ActionResult<OverlayVariation>> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const landingPage = await getOwnedLandingPage(s.client, landingPageId, s.orgId);
  if (!landingPage) return { success: false, error: NO_ACCESS };
  const result = await insertVariant(s.client, landingPage, input);
  if (result.success) revalidateOverlay(landingPage.campaign.site_id);
  return result;
}

export async function saveOverlayVariant(
  variantId: OverlayVariantId,
  input: { name: string; prompt: string; values: unknown; active: boolean },
): Promise<ActionResult> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const landingPage = await getOwnedVariantLandingPage(s.client, variantId, s.orgId);
  if (!landingPage) return { success: false, error: NO_ACCESS };

  const name = input.name.trim();
  if (!name) return { success: false, error: "Anna variaatiolle nimi." };

  const values = parseSlotValues(input.values, landingPage.slots);
  const changes = buildChanges(landingPage.slots, values);
  if (!changes.ok) return { success: false, error: changes.error };

  const { error } = await s.client
    .from("overlay_variants")
    .update({
      name: name.slice(0, 120),
      prompt: input.prompt.trim().slice(0, 2000),
      slot_values: values,
      changes: changes.changes,
      active: input.active === true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", variantId);

  if (error) {
    console.error("Save overlay variant error:", error);
    return { success: false, error: "Tallennus epäonnistui." };
  }
  revalidateOverlay(landingPage.campaign.site_id);
  return { success: true };
}

/** Julkaisukytkin kampanjasivulta. */
export async function setOverlayVariantActive(
  variantId: OverlayVariantId,
  active: boolean,
): Promise<ActionResult> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const landingPage = await getOwnedVariantLandingPage(s.client, variantId, s.orgId);
  if (!landingPage) return { success: false, error: NO_ACCESS };

  const { error } = await s.client
    .from("overlay_variants")
    .update({ active, updated_at: new Date().toISOString() })
    .eq("id", variantId);
  if (error) {
    console.error("Toggle overlay variant error:", error);
    return { success: false, error: "Tallennus epäonnistui." };
  }
  revalidateOverlay(landingPage.campaign.site_id);
  return { success: true };
}

export async function deleteOverlayVariant(variantId: OverlayVariantId): Promise<ActionResult> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const landingPage = await getOwnedVariantLandingPage(s.client, variantId, s.orgId);
  if (!landingPage) return { success: false, error: NO_ACCESS };

  const { error } = await s.client.from("overlay_variants").delete().eq("id", variantId);
  if (error) {
    console.error("Delete overlay variant error:", error);
    return { success: false, error: "Poisto epäonnistui." };
  }
  revalidateOverlay(landingPage.campaign.site_id);
  return { success: true };
}

// ---- Laskeutumissivut ------------------------------------------------------

function withRpCode(match: OverlayMatch): OverlayMatch {
  return Object.keys(match).length > 0 ? match : { rp: createRpCode() };
}

async function insertLandingPage(
  client: SupabaseClient,
  campaign: CampaignRow,
  input: { name: string; path: string; profileId?: string | null; match?: OverlayMatch },
): Promise<ActionResult<{ landingPageId: OverlayLandingPageId }>> {
  const name = input.name.trim().slice(0, 120);
  if (!name) return { success: false, error: "Anna laskeutumissivulle nimi." };
  const path = validPath(input.path);
  if (!path) return { success: false, error: "Polun pitää alkaa /-merkillä (tai olla *)." };

  const { data, error } = await client
    .from("overlay_landing_pages")
    .insert({
      campaign_id: campaign.id,
      name,
      path_pattern: path,
      profile_id: input.profileId && isValidUuid(input.profileId) ? input.profileId : null,
      // Ilman omaa UTM-kohdennusta sivu saa valmiin linkkitunnisteen (?rp=).
      match: withRpCode(parseMatch(input.match)),
    })
    .select("id, path_pattern")
    .single();

  if (error || !data) {
    console.error("Create overlay landing page error:", error);
    return { success: false, error: "Laskeutumissivun luonti epäonnistui." };
  }

  // Ensimmäinen variaatio valmiiksi, jotta esikatselulinkki toimii heti.
  const variant = await insertVariant(
    client,
    { id: data.id, path_pattern: data.path_pattern, campaign },
    { name: "Variaatio 1" },
  );
  if (!variant.success) return variant;

  return { success: true, data: { landingPageId: createOverlayLandingPageId(data.id) } };
}

export async function createOverlayLandingPage(
  campaignId: OverlayCampaignId,
  input: { name: string; path: string; profileId: string | null; utmTerm: string },
): Promise<ActionResult<{ landingPageId: OverlayLandingPageId }>> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const campaign = await getOwnedCampaign(s.client, campaignId, s.orgId);
  if (!campaign) return { success: false, error: NO_ACCESS };

  const result = await insertLandingPage(s.client, campaign, {
    name: input.name,
    path: input.path,
    profileId: input.profileId,
    match: { utm_term: input.utmTerm },
  });
  if (result.success) revalidateOverlay(campaign.site_id);
  return result;
}

/**
 * Tallentaa laskeutumissivun asetukset ja elementtilistan sekä päivittää
 * kaikkien variaatioiden snippetille johdetut muutokset.
 */
export async function saveOverlayLandingPage(
  landingPageId: OverlayLandingPageId,
  input: {
    name: string;
    pathPattern: string;
    match: unknown;
    profileId: string | null;
    slots: unknown;
  },
): Promise<ActionResult> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const landingPage = await getOwnedLandingPage(s.client, landingPageId, s.orgId);
  if (!landingPage) return { success: false, error: NO_ACCESS };

  const name = input.name.trim();
  if (!name) return { success: false, error: "Anna laskeutumissivulle nimi." };
  const path = validPath(input.pathPattern);
  if (!path) return { success: false, error: "Polun pitää alkaa /-merkillä (tai olla *)." };
  const parsed = parseSlots(input.slots);
  if (!parsed.ok) return { success: false, error: parsed.error };

  const { data: variants } = await s.client
    .from("overlay_variants")
    .select("id, slot_values")
    .eq("landing_page_id", landingPageId);

  // Lasketaan kaikki muutokset ennen kirjoituksia, ettei puolikasta tilaa jää.
  const updates: { id: string; changes: unknown; values: OverlaySlotValues }[] = [];
  for (const variant of variants ?? []) {
    const values = parseSlotValues(variant.slot_values, parsed.slots);
    const changes = buildChanges(parsed.slots, values);
    if (!changes.ok) return { success: false, error: changes.error };
    updates.push({ id: variant.id, changes: changes.changes, values });
  }

  const now = new Date().toISOString();
  const { error } = await s.client
    .from("overlay_landing_pages")
    .update({
      name: name.slice(0, 120),
      path_pattern: path,
      match: parseMatch(input.match),
      profile_id: input.profileId && isValidUuid(input.profileId) ? input.profileId : null,
      slots: parsed.slots,
      updated_at: now,
    })
    .eq("id", landingPageId);
  if (error) {
    console.error("Save overlay landing page error:", error);
    return { success: false, error: "Tallennus epäonnistui." };
  }

  for (const update of updates) {
    const { error: variantError } = await s.client
      .from("overlay_variants")
      .update({ changes: update.changes, slot_values: update.values, updated_at: now })
      .eq("id", update.id);
    if (variantError) {
      console.error("Sync overlay variant error:", variantError);
      return { success: false, error: "Variaatioiden päivitys epäonnistui." };
    }
  }

  revalidateOverlay(landingPage.campaign.site_id);
  return { success: true };
}

export async function deleteOverlayLandingPage(
  landingPageId: OverlayLandingPageId,
): Promise<ActionResult> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const landingPage = await getOwnedLandingPage(s.client, landingPageId, s.orgId);
  if (!landingPage) return { success: false, error: NO_ACCESS };

  const { error } = await s.client.from("overlay_landing_pages").delete().eq("id", landingPageId);
  if (error) {
    console.error("Delete overlay landing page error:", error);
    return { success: false, error: "Poisto epäonnistui." };
  }
  revalidateOverlay(landingPage.campaign.site_id);
  return { success: true };
}

// ---- Kampanjat ---------------------------------------------------------------

/** Kampanjan kohde: ulkoinen sivu (URL) tai organisaation oma Pages-sivusto. */
export type CampaignTargetInput = { name: string; targetUrl: string; pagesSiteId?: string };

/** Oman Pages-sivuston ensisijainen origin, jos sivusto kuuluu organisaatiolle. */
async function ownPagesOrigin(
  client: SupabaseClient,
  orgId: string,
  pagesSiteId: string,
): Promise<string | null> {
  if (!isValidUuid(pagesSiteId)) return null;
  const { data } = await client
    .from("sites")
    .select("subdomain, custom_domain")
    .eq("id", pagesSiteId)
    .eq("user_id", orgId)
    .maybeSingle();
  return data ? (pagesSiteOrigins(data)[0] ?? null) : null;
}

async function createCampaignCore(
  client: SupabaseClient,
  orgId: string,
  siteId: SiteId,
  input: CampaignTargetInput,
): Promise<ActionResult<{ campaignId: OverlayCampaignId; landingPageId: OverlayLandingPageId }>> {
  const name = input.name.trim();
  if (!name) return { success: false, error: "Anna kampanjalle nimi." };

  let targetUrl = input.targetUrl;
  if (input.pagesSiteId) {
    const origin = await ownPagesOrigin(client, orgId, input.pagesSiteId);
    if (!origin) return { success: false, error: "Pages-sivustoa ei löydy." };
    targetUrl = `${origin}/`;
  }
  const target = parseTargetUrl(targetUrl);
  if (!target) {
    return { success: false, error: "Anna kelvollinen sivun osoite, esim. https://asiakas.fi/hinnasto." };
  }

  const { data: site } = await client
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", orgId)
    .maybeSingle();
  if (!site) return { success: false, error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia." };

  const { data, error } = await client
    .from("overlay_campaigns")
    .insert({ site_id: siteId, name: name.slice(0, 120), target_origin: target.origin })
    .select("id, site_id, name, target_origin")
    .single();
  if (error || !data) {
    console.error("Create overlay campaign error:", error);
    return { success: false, error: "Kampanjan luonti epäonnistui." };
  }

  const landingPage = await insertLandingPage(client, data, {
    name: target.path === "/" ? "Etusivu" : target.path,
    path: target.path,
  });
  if (!landingPage.success) return landingPage;

  return {
    success: true,
    data: {
      campaignId: createOverlayCampaignId(data.id),
      landingPageId: landingPage.data.landingPageId,
    },
  };
}

export async function createOverlayCampaign(
  siteId: SiteId,
  input: CampaignTargetInput,
): Promise<ActionResult<{ campaignId: OverlayCampaignId; landingPageId: OverlayLandingPageId }>> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const result = await createCampaignCore(s.client, s.orgId, siteId, input);
  if (result.success) revalidateOverlay(siteId);
  return result;
}

/**
 * "Uusi sivusto → Overlay": luo sivuston asiakkaan domainista johdetulla
 * subdomainilla ja sille kampanjan.
 */
export async function createOverlaySite(input: { targetUrl: string }): Promise<
  ActionResult<{
    siteId: SiteId;
    campaignId: OverlayCampaignId;
    landingPageId: OverlayLandingPageId;
  }>
> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };

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
    const { data, error } = await s.client
      .from("sites")
      .insert({ user_id: s.orgId, subdomain, custom_domain: null, settings: {} })
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

  const campaign = await createCampaignCore(s.client, s.orgId, siteId, {
    name: new URL(target.origin).hostname.replace(/^www\./, ""),
    targetUrl: input.targetUrl,
  });
  if (!campaign.success) return campaign;

  revalidatePath("/app/dashboard");
  return { success: true, data: { siteId, ...campaign.data } };
}

export async function updateOverlayCampaign(
  campaignId: OverlayCampaignId,
  input: { name?: string; active?: boolean },
): Promise<ActionResult> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const campaign = await getOwnedCampaign(s.client, campaignId, s.orgId);
  if (!campaign) return { success: false, error: NO_ACCESS };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) return { success: false, error: "Anna kampanjalle nimi." };
    patch.name = name.slice(0, 120);
  }
  if (input.active !== undefined) patch.active = input.active === true;

  const { error } = await s.client.from("overlay_campaigns").update(patch).eq("id", campaignId);
  if (error) {
    console.error("Update overlay campaign error:", error);
    return { success: false, error: "Tallennus epäonnistui." };
  }
  revalidateOverlay(campaign.site_id);
  return { success: true };
}

export async function deleteOverlayCampaign(campaignId: OverlayCampaignId): Promise<ActionResult> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const campaign = await getOwnedCampaign(s.client, campaignId, s.orgId);
  if (!campaign) return { success: false, error: NO_ACCESS };

  const { error } = await s.client.from("overlay_campaigns").delete().eq("id", campaignId);
  if (error) {
    console.error("Delete overlay campaign error:", error);
    return { success: false, error: "Poisto epäonnistui." };
  }
  revalidateOverlay(campaign.site_id);
  return { success: true };
}

// ---- Profiilit -------------------------------------------------------------------

const PROFILE_COLUMNS = "id, name, description, source";

function toProfile(row: {
  id: string;
  name: string;
  description: string;
  source: string;
}): OverlayProfile {
  return {
    id: createOverlayProfileId(row.id),
    name: row.name,
    description: row.description,
    source: row.source as OverlayProfile["source"],
  };
}

async function insertProfile(
  client: SupabaseClient,
  orgId: string,
  input: { name: string; description: string; source: OverlayProfile["source"]; sourceId?: string },
): Promise<ActionResult<OverlayProfile>> {
  const name = input.name.trim().slice(0, 120);
  if (!name) return { success: false, error: "Anna profiilille nimi." };

  const { data, error } = await client
    .from("overlay_profiles")
    .insert({
      org_id: orgId,
      name,
      description: input.description.trim().slice(0, 8000),
      source: input.source,
      source_id: input.sourceId ?? null,
    })
    .select(PROFILE_COLUMNS)
    .single();
  if (error || !data) {
    console.error("Create overlay profile error:", error);
    return { success: false, error: "Profiilin luonti epäonnistui." };
  }
  return { success: true, data: toProfile(data) };
}

export async function createOverlayProfile(input: {
  name: string;
  description: string;
}): Promise<ActionResult<OverlayProfile>> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  return insertProfile(s.client, s.orgId, { ...input, source: "custom" });
}

export async function updateOverlayProfile(
  profileId: OverlayProfileId,
  input: { name: string; description: string },
): Promise<ActionResult> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const name = input.name.trim();
  if (!name) return { success: false, error: "Anna profiilille nimi." };

  // RLS rajaa päivityksen organisaation omiin profiileihin.
  const { data, error } = await s.client
    .from("overlay_profiles")
    .update({
      name: name.slice(0, 120),
      description: input.description.trim().slice(0, 8000),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .eq("org_id", s.orgId)
    .select("id");
  if (error || !data?.length) return { success: false, error: "Tallennus epäonnistui." };
  return { success: true };
}

export async function deleteOverlayProfile(profileId: OverlayProfileId): Promise<ActionResult> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const { error } = await s.client
    .from("overlay_profiles")
    .delete()
    .eq("id", profileId)
    .eq("org_id", s.orgId);
  if (error) return { success: false, error: "Poisto epäonnistui." };
  return { success: true };
}

/** Profiili Rascal AI:n ihanneasiakkaasta (icp_summary + ostajapersoona). */
export async function importRascalProfile(): Promise<ActionResult<OverlayProfile>> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };

  const { data } = await createAdminClient()
    .from("users")
    .select("icp_summary, buyer_persona")
    .eq("id", s.orgId)
    .maybeSingle();

  const description = [
    describeProfileData(data?.icp_summary),
    describeProfileData(data?.buyer_persona),
  ]
    .filter(Boolean)
    .join("\n\n");
  if (!description) {
    return {
      success: false,
      error: "Rascal AI -profiilissa ei ole vielä ihanneasiakasta. Täydennä se Rascal AI:ssa.",
    };
  }

  return insertProfile(s.client, s.orgId, {
    name: "Ihanneasiakas (Rascal AI)",
    description,
    source: "rascal_ai",
  });
}

/** Profiili Rascal CRM:n segmentistä. */
export async function importCrmSegmentProfile(
  segmentId: string,
): Promise<ActionResult<OverlayProfile>> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  if (!isValidUuid(segmentId)) return { success: false, error: NO_ACCESS };

  const { data: segment } = await createAdminClient()
    .from("contact_segments")
    .select("id, name, description")
    .eq("id", segmentId)
    .eq("user_id", s.orgId)
    .maybeSingle();
  if (!segment) return { success: false, error: NO_ACCESS };

  return insertProfile(s.client, s.orgId, {
    name: segment.name ?? "CRM-segmentti",
    description: segment.description ?? "",
    source: "crm_segment",
    sourceId: segment.id,
  });
}

// ---- AI-personointi ------------------------------------------------------------

/** AI-generointien rajoitus organisaatiota kohden. */
const copyLimiter = new RateLimiter({ maxRequests: 30, windowMs: 15 * 60 * 1000 });

/**
 * Personoi variaation tekstit laskeutumissivun tallennettuihin
 * tekstielementteihin. Ei tallenna: arvot palautetaan editoriin tarkistettaviksi.
 */
export async function personalizeOverlayVariant(
  landingPageId: OverlayLandingPageId,
  input: { angle: string },
): Promise<ActionResult<{ values: OverlaySlotValues }>> {
  const s = await session();
  if (!s) return { success: false, error: SIGN_IN };
  const landingPage = await getOwnedLandingPage(s.client, landingPageId, s.orgId);
  if (!landingPage) return { success: false, error: NO_ACCESS };

  if (!copyLimiter.check(s.orgId).allowed) {
    return { success: false, error: "Liian monta generointia. Yritä hetken päästä uudelleen." };
  }

  let profile: { name: string; description: string } | null = null;
  if (landingPage.profile_id) {
    const { data } = await s.client
      .from("overlay_profiles")
      .select("name, description")
      .eq("id", landingPage.profile_id)
      .maybeSingle();
    profile = data ?? null;
  }

  const brand = await loadBrandContext(s.orgId);
  const result = await generateVariantCopy(
    brand,
    { profile, angle: input.angle.slice(0, 2000) },
    landingPage.slots,
  );
  if (!result.ok) return { success: false, error: result.error };
  return { success: true, data: { values: result.values } };
}
