import { createClient } from "@/src/utils/supabase/server";
import { notFound } from "next/navigation";
import SiteRenderer from "@/app/components/renderer/SiteRenderer";

// Estetään pre-rendering build-aikana, koska sivu vaatii runtime-tietokantakutsuja
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ domain: string }>;
}

export default async function PublicSitePage({ params }: PageProps) {
  const { domain } = await params;
  const supabase = await createClient();

  console.log("[PublicSitePage] Haetaan sivustoa domainilla:", domain);

  // Hae sivuston tiedot subdomainin tai custom domainin perusteella
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .or(`subdomain.eq.${domain},custom_domain.eq.${domain}`)
    .maybeSingle();

  if (siteError) {
    console.error("[PublicSitePage] Virhe sivuston haussa:", siteError);
    notFound();
  }

  if (!site) {
    console.log(
      `[PublicSitePage] Sivustoa ei löydy domainilla: ${domain}. Tarkista että custom_domain tai subdomain on tallennettu tietokantaan.`,
    );

    // Debug: Hae kaikki sivustot nähdäksemme mitä tietokannassa on
    const { data: allSites } = await supabase
      .from("sites")
      .select("id, subdomain, custom_domain")
      .limit(10);
    console.log("[PublicSitePage] Tietokannassa olevat sivustot:", allSites);

    notFound();
  }

  console.log("[PublicSitePage] Sivusto löytyi:", {
    id: site.id,
    subdomain: site.subdomain,
    custom_domain: site.custom_domain,
  });

  // Hae julkaistu sivu (slug='home' oletuksena)
  // Huom: Jos sivua ei ole julkaistu, käytetään oletussisältöä
  const { data: page, error: pageError } = await supabase
    .from("pages")
    .select("*")
    .eq("site_id", site.id)
    .eq("slug", "home")
    .maybeSingle();

  if (pageError) {
    console.error("Virhe sivun haussa:", pageError);
  }

  // Jos sivua ei löydy tai se ei ole julkaistu, käytetään oletustemplatea
  const { getDefaultTemplate } = await import("@/src/lib/templates");
  const defaultTemplate = getDefaultTemplate();
  const defaultContent = defaultTemplate.defaultContent;

  const content = page?.content || defaultContent;

  return <SiteRenderer content={content} siteId={site.id} />;
}
