"use server";

import { createClient } from "@/src/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { SiteId } from "@/src/lib/types";
import {
  addDomainToProject,
  removeDomainFromProject,
  getDomainStatus,
  isVercelConfigured,
  recommendedDnsRecord,
  type DnsRecommendation,
} from "@/src/lib/vercel-domains";

interface UpdateDomainResult {
  success?: boolean;
  domain?: string | null;
  /** DNS record the customer must add at their registrar (set on success). */
  record?: DnsRecommendation;
  error?: string;
}

function cleanDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
  return domainRegex.test(domain);
}

async function verifySiteOwnership(
  supabase: Awaited<ReturnType<typeof createClient>>,
  siteId: SiteId,
  orgId: string,
): Promise<{ error?: string }> {
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", orgId)
    .single();

  if (siteError || !site) {
    return {
      error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia muokata sitä.",
    };
  }
  return {};
}

export async function updateSiteDomain(
  siteId: SiteId,
  customDomain: string,
): Promise<UpdateDomainResult> {
  const supabase = await createClient();

  // 1. Tarkista käyttäjä
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      error: "Sinun täytyy olla kirjautunut sisään.",
    };
  }

  // 2. Hae käyttäjän organisaatio
  const { data: orgMember, error: orgMemberError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (!orgMember || orgMemberError) {
    return {
      error: "Käyttäjätiliä ei löydy.",
    };
  }

  // 3. Cleanaa ja validoi domain
  const cleanedDomain = cleanDomain(customDomain);
  console.log(
    `[updateSiteDomain] Input: "${customDomain}" -> Cleaned: "${cleanedDomain}"`,
  );

  // Jos tyhjä, poistetaan domain (asetetaan NULL)
  if (!cleanedDomain) {
    // Varmista että käyttäjä omistaa sivuston ja hae nykyinen domain
    const { data: site, error: siteError } = await supabase
      .from("sites")
      .select("id, custom_domain")
      .eq("id", siteId)
      .eq("user_id", orgMember.org_id)
      .single();

    if (siteError || !site) {
      return {
        error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia muokata sitä.",
      };
    }

    // Poista domain Vercel-projektista (best-effort)
    if (site.custom_domain && isVercelConfigured()) {
      await removeDomainFromProject(site.custom_domain);
    }

    // Poista custom domain
    const { error: updateError } = await supabase
      .from("sites")
      .update({
        custom_domain: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", siteId);

    if (updateError) {
      console.error("Virhe domainin poistossa:", updateError);
      return {
        error: "Domainin poisto epäonnistui.",
      };
    }

    revalidatePath("/app/dashboard");
    revalidatePath(`/app/dashboard/${siteId}`);

    return {
      success: true,
      domain: null,
    };
  }

  // 4. Validoi domain-muoto
  if (!isValidDomain(cleanedDomain)) {
    return {
      error: "Virheellinen domain-muoto. Käytä muotoa esim. kampanja.yritys.fi",
    };
  }

  // 5. Tarkista että domain ei ole jo käytössä
  const { data: existingSite, error: checkError } = await supabase
    .from("sites")
    .select("id")
    .eq("custom_domain", cleanedDomain)
    .neq("id", siteId)
    .maybeSingle();

  if (checkError) {
    console.error("Virhe domainin tarkistuksessa:", checkError);
    return {
      error: "Domainin tarkistus epäonnistui. Yritä uudelleen.",
    };
  }

  if (existingSite) {
    return {
      error: "Domain on jo käytössä",
    };
  }

  // 6. Varmista että käyttäjä omistaa sivuston
  const ownershipCheck = await verifySiteOwnership(
    supabase,
    siteId,
    orgMember.org_id,
  );
  if (ownershipCheck.error) {
    return ownershipCheck;
  }

  // 7. Päivitä custom domain
  console.log(
    `[updateSiteDomain] Päivitetään sivuston ${siteId} custom_domain arvoon: "${cleanedDomain}"`,
  );

  const { error: updateError } = await supabase
    .from("sites")
    .update({
      custom_domain: cleanedDomain,
      updated_at: new Date().toISOString(),
    })
    .eq("id", siteId);

  if (updateError) {
    console.error(
      "[updateSiteDomain] Virhe domainin päivityksessä:",
      updateError,
    );
    return {
      error: "Domainin päivitys epäonnistui.",
    };
  }

  // 8. Rekisteröi domain Vercel-projektiin (TLS + reititys hoituvat siellä)
  if (isVercelConfigured()) {
    const added = await addDomainToProject(cleanedDomain);
    if (!added.ok) {
      console.error(
        "[updateSiteDomain] Vercel-rekisteröinti epäonnistui:",
        added.error,
      );
      return {
        error: `Domain tallennettiin, mutta sen rekisteröinti epäonnistui: ${added.error}`,
        domain: cleanedDomain,
        record: recommendedDnsRecord(cleanedDomain),
      };
    }
  }

  // 9. Revalidate paths
  revalidatePath("/app/dashboard");
  revalidatePath(`/app/dashboard/${siteId}`);

  return {
    success: true,
    domain: cleanedDomain,
    record: recommendedDnsRecord(cleanedDomain),
  };
}

interface DomainStatusResult {
  verified?: boolean;
  record?: DnsRecommendation;
  error?: string;
}

/**
 * Check whether a site's custom domain is verified and serving on Vercel.
 * Used by the settings UI to show "Odottaa DNS:ää" vs "Aktiivinen".
 */
export async function getSiteDomainStatus(
  siteId: SiteId,
): Promise<DomainStatusResult> {
  const supabase = await createClient();

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
  if (!orgMember) {
    return { error: "Käyttäjätiliä ei löydy." };
  }

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("custom_domain")
    .eq("id", siteId)
    .eq("user_id", orgMember.org_id)
    .single();

  if (siteError || !site || !site.custom_domain) {
    return { error: "Sivustolla ei ole custom domainia." };
  }

  if (!isVercelConfigured()) {
    return {
      verified: false,
      record: recommendedDnsRecord(site.custom_domain),
    };
  }

  const status = await getDomainStatus(site.custom_domain);
  if (!status.ok) {
    return { error: status.error };
  }
  return { verified: status.data.verified, record: status.data.record };
}
