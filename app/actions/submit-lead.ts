"use server";

import { createClient } from "@/src/utils/supabase/server";
import { SiteId } from "@/src/lib/types";

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

/**
 * Core lead submission logic (testable)
 * Sends lead data to n8n webhook for processing
 */
export async function submitLeadCore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteId: SiteId,
  email: string,
  name?: string,
  marketingConsent?: boolean,
  webhookUrl?: string,
): Promise<SubmitLeadResult> {
  // 1. Normalize inputs
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name?.trim() || null;

  // 2. Validate inputs
  if (!isValidEmail(normalizedEmail)) {
    return { error: "Virheellinen sähköpostiosoite." };
  }

  // 3. Verify site is published
  const publishCheck = await verifySitePublished(supabase, siteId);
  if (!publishCheck.published) {
    return { error: publishCheck.error };
  }

  // 4. Send to n8n webhook (n8n handles Supabase insert)
  const webhook = webhookUrl ?? process.env.N8N_RASCALPAGES_LEADS;
  if (!webhook) {
    console.error("N8N_RASCALPAGES_LEADS webhook URL not configured");
    return { error: "Palveluvirhe. Yritä myöhemmin uudelleen." };
  }

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "new_lead",
        siteId,
        email: normalizedEmail,
        name: normalizedName,
        marketingConsent: marketingConsent ?? false,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      console.error("n8n webhook error:", response.status, response.statusText);
      return { error: "Tallennus epäonnistui. Yritä uudelleen." };
    }
  } catch (err) {
    console.error("n8n webhook error:", err);
    return { error: "Tallennus epäonnistui. Yritä uudelleen." };
  }

  return { success: true };
}

/**
 * Server action wrapper for submitLeadCore
 * This is called from client components
 */
export async function submitLead(
  siteId: SiteId,
  email: string,
  name?: string,
  marketingConsent?: boolean,
): Promise<SubmitLeadResult> {
  const supabase = await createClient();
  return submitLeadCore(supabase, siteId, email, name, marketingConsent);
}
