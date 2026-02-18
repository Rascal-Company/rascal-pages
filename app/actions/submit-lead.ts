"use server";

import { headers } from "next/headers";
import { createClient } from "@/src/utils/supabase/server";
import { ipLimiter, ipSiteLimiter } from "@/src/lib/rate-limit";
import type { SiteId } from "@/src/lib/types";

interface SubmitLeadResult {
  success?: boolean;
  error?: string;
}

function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function verifySitePublished(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteId: string,
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
  const publishCheck = await verifySitePublished(supabase, siteId);
  if (!publishCheck.published) {
    return { error: publishCheck.error };
  }

  // 3. Prepare payload
  const payload = {
    type: "new_lead",
    siteId,
    fields: {
      ...cleanFields,
      email: normalizedEmail,
    },
    timestamp: new Date().toISOString(),
  };

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

  return { success: true };
}

/**
 * Server action wrapper for submitLeadCore
 * This is called from client components
 */
export async function submitLead(
  siteId: SiteId,
  fields: Record<string, string | boolean>,
  customWebhookUrl?: string | null,
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
  return submitLeadCore(supabase, siteId, fields, customWebhookUrl);
}
