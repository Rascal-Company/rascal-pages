"use server";

import { createClient } from "@/src/utils/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateDomainResult {
  success?: boolean;
  domain?: string | null;
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
  siteId: string,
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
  siteId: string,
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
    // Varmista että käyttäjä omistaa sivuston
    const ownershipCheck = await verifySiteOwnership(
      supabase,
      siteId,
      orgMember.org_id,
    );
    if (ownershipCheck.error) {
      return ownershipCheck;
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

  console.log(
    `[updateSiteDomain] Custom domain päivitetty onnistuneesti: "${cleanedDomain}"`,
  );

  // 8. Revalidate paths
  revalidatePath("/app/dashboard");
  revalidatePath(`/app/dashboard/${siteId}`);

  return {
    success: true,
    domain: cleanedDomain,
  };
}
