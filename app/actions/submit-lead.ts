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
 * Separated from server action wrapper for unit testing
 */
export async function submitLeadCore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteId: SiteId,
  email: string,
  name?: string,
  webhookUrl?: string,
): Promise<SubmitLeadResult> {
  // 1. Normalize inputs
  const normalizedEmail = email.trim().toLowerCase();
  const normalizedName = name?.trim() || null;

  // 2. Validate inputs
  if (!isValidEmail(normalizedEmail)) {
    return { error: "Virheellinen sähköpostiosoite." };
  }

  // 3. Verify site is published (RLS will also check, but fail fast)
  const publishCheck = await verifySitePublished(supabase, siteId);
  if (!publishCheck.published) {
    return { error: publishCheck.error };
  }

  // 4. Insert lead (RLS policy enforces published check)
  const { error: insertError } = await supabase.from("leads").insert({
    site_id: siteId,
    email: normalizedEmail,
    name: normalizedName,
    data: { source: "website_form" },
  });

  if (insertError) {
    console.error("Lead insert error:", insertError);
    return { error: "Tallennus epäonnistui. Yritä uudelleen." };
  }

  // 5. Send to n8n webhook (optional, fire-and-forget)
  const webhook = webhookUrl ?? process.env.N8N_RASCALPAGES_LEADS;
  if (webhook) {
    fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "new_lead",
        siteId,
        email: normalizedEmail,
        name: normalizedName,
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => {
      console.error("n8n webhook error:", err);
    });
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
): Promise<SubmitLeadResult> {
  const supabase = await createClient();
  return submitLeadCore(supabase, siteId, email, name);
}
