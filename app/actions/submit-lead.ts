"use server";

import { headers } from "next/headers";
import { createClient } from "@/src/utils/supabase/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { ipLimiter, ipSiteLimiter } from "@/src/lib/rate-limit";
import { isSiteLive } from "@/src/lib/site-plan-server";
import {
  DOWNLOAD_BUCKET,
  GATED_LINK_SECONDS,
  downloadFileName,
  isSiteDownloadPath,
} from "@/src/lib/site-downloads";
import type { SiteId } from "@/src/lib/types";

type LeadDownload = { url: string; fileName: string };

interface SubmitLeadResult {
  success?: boolean;
  error?: string;
  /** Lomakkeen lahja: allekirjoitettu latauslinkki (RAS-1115). */
  download?: LeadDownload;
}

/** Allekirjoittaa yksityisen tiedoston latauslinkin; null jos ei onnistu. */
export type DownloadSigner = (path: string, fileName: string) => Promise<string | null>;

async function signWithAdmin(path: string, fileName: string): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .storage.from(DOWNLOAD_BUCKET)
    .createSignedUrl(path, GATED_LINK_SECONDS, { download: fileName });
  if (error || !data) {
    console.error("Latauslinkin allekirjoitus epäonnistui:", error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Lomakkeen lahjan linkki. Polku tulee kävijän selaimesta, joten se
 * tarkistetaan kuuluvaksi juuri tämän sivuston lomaketiedostoihin.
 */
async function siteOwner(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteId: SiteId,
): Promise<{ userId: string } | null> {
  const { data } = await supabase.from("sites").select("user_id").eq("id", siteId).maybeSingle();
  return data?.user_id ? { userId: data.user_id as string } : null;
}

async function resolveLeadDownload(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteId: SiteId,
  path: string,
  sign: DownloadSigner,
): Promise<LeadDownload | null> {
  const site = await siteOwner(supabase, siteId);
  if (!site || !isSiteDownloadPath(path, site.userId, siteId, "gated")) return null;
  const fileName = downloadFileName(path);
  const url = await sign(path, fileName);
  return url ? { url, fileName } : null;
}

type CrmExport = { export: boolean; tag?: string };

/** Kuka lähettää lahjalinkin sähköpostiin: Rascal (n8n + Brevo) vai asiakkaan oma CRM-automaatio. */
export type GiftDelivery = "rascal" | "crm";

/** Lähettää liidin CRM:ään; false jos CRM-rajapintaa ei ole konfiguroitu tai kutsu epäonnistui. */
export type CrmLeadSender = (lead: CrmLead) => Promise<boolean>;

export type CrmLead = {
  organizationId: string;
  submissionId: string;
  email: string;
  name?: string;
  marketingConsent: boolean;
  tag?: string | null;
  siteId: string;
  download?: LeadDownload;
};

/**
 * Liidi suoraan Rascal CRM:n rajapintaan (RAS-1117), jolloin CRM:n omat
 * automaatiot käynnistyvät. Ilman konfiguraatiota palautetaan false ja liidi
 * kulkee vanhaa n8n-polkua.
 */
async function sendLeadToCrm(lead: CrmLead): Promise<boolean> {
  const baseUrl = process.env.RASCAL_CRM_URL;
  const secret = process.env.RASCAL_PAGES_LEADS_SECRET;
  if (!baseUrl || !secret) return false;
  try {
    const res = await fetch(new URL("/api/integrations/rascal-pages/leads", baseUrl), {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-rascal-pages-secret": secret },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) console.error("CRM lead error:", res.status);
    return res.ok;
  } catch (err) {
    console.error("CRM lead error:", err);
    return false;
  }
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/** Onko sivusto paketin puolesta julkinen; injektoitava testejä varten. */
export type SiteLiveCheck = (siteId: string, orgId: string) => Promise<boolean>;

async function verifySitePublished(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteId: string,
  isLive: SiteLiveCheck,
): Promise<{ published: boolean; error?: string }> {
  const { data: page, error } = await supabase
    .from("pages")
    .select("published")
    .eq("site_id", siteId)
    .eq("slug", "home")
    .maybeSingle();

  if (error || !page) {
    return { published: false, error: "Sivustoa ei löydy." };
  }

  if (!page.published) {
    return { published: false, error: "Sivusto ei ole julkaistu." };
  }

  // Maksumuurin takana oleva sivusto ei ota liidejä vastaan (RAS-1169).
  const owner = await siteOwner(supabase, siteId as SiteId);
  if (owner && !(await isLive(siteId, owner.userId))) {
    return { published: false, error: "Sivusto ei ole julkaistu." };
  }

  return { published: true };
}

const MIN_SUBMISSION_TIME_MS = 2000;

function isBotSubmission(fields: Record<string, string | boolean>): boolean {
  if (fields._hp_website) return true;

  const ts = Number(fields._hp_ts);
  if (ts > 0 && Date.now() - ts < MIN_SUBMISSION_TIME_MS) return true;

  return false;
}

function stripBotFields(
  fields: Record<string, string | boolean>,
): Record<string, string | boolean> {
  const { _hp_website, _hp_ts, ...clean } = fields;
  return clean;
}

/**
 * Core lead submission logic (testable)
 * Sends lead data to n8n webhook for processing
 */
export async function submitLeadCore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteId: SiteId,
  fields: Record<string, string | boolean>,
  customWebhookUrl?: string | null,
  crm?: CrmExport,
  downloadPath?: string | null,
  sign: DownloadSigner = signWithAdmin,
  options: { giftDelivery?: GiftDelivery; sendToCrm?: CrmLeadSender; isLive?: SiteLiveCheck } = {},
): Promise<SubmitLeadResult> {
  // 0. Bot protection: honeypot + timing check
  if (isBotSubmission(fields)) {
    return { success: true };
  }
  const cleanFields = stripBotFields(fields);

  // 1. Extract and normalize email (required field)
  const email = cleanFields.email as string;
  if (!email || !isValidEmail(email.trim())) {
    return { error: "Virheellinen sähköpostiosoite." };
  }
  const normalizedEmail = email.trim().toLowerCase();

  // 2. Verify site is published
  const publishCheck = await verifySitePublished(supabase, siteId, options.isLive ?? isSiteLive);
  if (!publishCheck.published) {
    return { error: publishCheck.error };
  }

  // 3. Prepare payload
  const payload: {
    type: string;
    siteId: SiteId;
    fields: Record<string, string | boolean>;
    timestamp: string;
    crm?: { export: true; tag: string | null };
    download?: LeadDownload;
  } = {
    type: "new_lead",
    siteId,
    fields: {
      ...cleanFields,
      email: normalizedEmail,
    },
    timestamp: new Date().toISOString(),
  };

  const download = downloadPath
    ? await resolveLeadDownload(supabase, siteId, downloadPath, sign)
    : null;

  // CRM-vienti suoraan CRM:n rajapintaan; jos se ei ole käytössä, n8n hoitaa
  // viennin vanhaan tapaan (payload.crm).
  let sentToCrm = false;
  if (crm?.export === true) {
    const site = await siteOwner(supabase, siteId);
    if (site) {
      sentToCrm = await (options.sendToCrm ?? sendLeadToCrm)({
        organizationId: site.userId,
        submissionId: crypto.randomUUID(),
        email: normalizedEmail,
        name: typeof cleanFields.name === "string" ? cleanFields.name : undefined,
        marketingConsent: cleanFields.marketingConsent === true,
        tag: crm.tag?.trim() || null,
        siteId,
        ...(download ? { download } : {}),
      });
    }
    if (!sentToCrm) payload.crm = { export: true, tag: crm.tag?.trim() || null };
  }

  // Lahjaviesti: Rascal lähettää linkin n8n:n kautta, ellei asiakkaan oma
  // CRM-automaatio hoida sitä (linkki on silloin CRM-aktiviteetin metadatassa).
  const crmDeliversGift = options.giftDelivery === "crm" && sentToCrm;
  if (download && !crmDeliversGift) payload.download = download;

  // 4. Send to default n8n webhook (always)
  const defaultWebhook = process.env.N8N_RASCALPAGES_LEADS;
  if (!defaultWebhook) {
    console.error("N8N_RASCALPAGES_LEADS webhook URL not configured");
    return { error: "Palveluvirhe. Yritä myöhemmin uudelleen." };
  }

  try {
    const response = await fetch(defaultWebhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error("n8n webhook error:", response.status, response.statusText);
      return { error: "Tallennus epäonnistui. Yritä uudelleen." };
    }
  } catch (err) {
    console.error("n8n webhook error:", err);
    return { error: "Tallennus epäonnistui. Yritä uudelleen." };
  }

  // 5. Send to custom webhook if provided (optional, don't fail if this errors)
  if (customWebhookUrl) {
    try {
      await fetch(customWebhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch (err) {
      console.error("Custom webhook error:", err);
      // Don't return error - default webhook succeeded
    }
  }

  return download ? { success: true, download } : { success: true };
}

/**
 * Server action wrapper for submitLeadCore
 * This is called from client components
 */
export async function submitLead(
  siteId: SiteId,
  fields: Record<string, string | boolean>,
  customWebhookUrl?: string | null,
  crm?: CrmExport,
  downloadPath?: string | null,
  giftDelivery?: GiftDelivery,
): Promise<SubmitLeadResult> {
  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (!ipLimiter.check(ip).allowed) {
    return { error: "Liian monta yritystä. Yritä myöhemmin uudelleen." };
  }

  if (!ipSiteLimiter.check(`${ip}:${siteId}`).allowed) {
    return { error: "Liian monta yritystä. Yritä myöhemmin uudelleen." };
  }

  const supabase = await createClient();
  return submitLeadCore(supabase, siteId, fields, customWebhookUrl, crm, downloadPath, undefined, {
    giftDelivery,
  });
}
