"use server";

import { createClient } from "@/src/utils/supabase/server";

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

export async function submitLead(
  siteId: string,
  email: string,
  name?: string,
): Promise<SubmitLeadResult> {
  const supabase = await createClient();

  // 1. Validate inputs
  if (!isValidEmail(email)) {
    return { error: "Virheellinen sähköpostiosoite." };
  }

  // 2. Verify site is published (RLS will also check, but fail fast)
  const publishCheck = await verifySitePublished(supabase, siteId);
  if (!publishCheck.published) {
    return { error: publishCheck.error };
  }

  // 3. Insert lead (RLS policy enforces published check)
  const { error: insertError } = await supabase.from("leads").insert({
    site_id: siteId,
    email: email.trim().toLowerCase(),
    name: name?.trim() || null,
    data: { source: "website_form" },
  });

  if (insertError) {
    console.error("Lead insert error:", insertError);
    return { error: "Tallennus epäonnistui. Yritä uudelleen." };
  }

  // 4. Send to n8n webhook (optional, fire-and-forget)
  if (process.env.N8N_WEBHOOK_URL) {
    fetch(process.env.N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "new_lead",
        siteId,
        email,
        name,
        timestamp: new Date().toISOString(),
      }),
    }).catch((err) => {
      console.error("n8n webhook error:", err);
    });
  }

  return { success: true };
}
