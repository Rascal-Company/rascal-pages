import type { Metadata } from "next";
import { createClient } from "@/src/utils/supabase/server";
import { notFound } from "next/navigation";
import SiteRenderer from "@/app/components/renderer/SiteRenderer";
import { createSiteId } from "@/src/lib/types";
import ThirdPartyScripts from "@/app/components/analytics/ThirdPartyScripts";
import {
  getPublishedPosts,
  getRequestBaseUrl,
  getSiteByDomain,
  getSiteChrome,
} from "@/src/lib/site-queries";
import { migrateToSections } from "@/app/components/editor/utils/contentUtils";
import {
  buildCanonicalUrl,
  buildPersonJsonLd,
  resolvePageSeo,
} from "@/src/lib/seo";
import JsonLd from "@/app/components/JsonLd";
import type {
  AboutContent,
  HeroContent,
  TemplateConfig,
} from "@/src/lib/templates";

// Estetään pre-rendering build-aikana, koska sivu vaatii runtime-tietokantakutsuja
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ domain: string }>;
}

/**
 * Extract a display name and bio from page content for SEO / structured data,
 * preferring the about section and falling back to the hero.
 */
function extractIdentity(content: TemplateConfig): {
  name: string;
  description: string;
} {
  const about = content.sections.find((s) => s.type === "about")?.content as
    | AboutContent
    | undefined;
  const hero = content.sections.find((s) => s.type === "hero")?.content as
    | HeroContent
    | undefined;

  return {
    name: about?.name || hero?.title || "",
    description: about?.bio || hero?.subtitle || "",
  };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { domain } = await params;
  const site = await getSiteByDomain(domain);
  if (!site) return {};

  const supabase = await createClient();
  const { data: page } = await supabase
    .from("pages")
    .select("content")
    .eq("site_id", site.id)
    .eq("slug", "home")
    .maybeSingle();

  const normalized = migrateToSections(
    (page?.content as TemplateConfig | null) ?? undefined,
  );
  const { name, description } = extractIdentity(normalized);
  const baseUrl = await getRequestBaseUrl();
  const canonical = buildCanonicalUrl(baseUrl, "/");
  const seo = resolvePageSeo(normalized.seo, {
    title: name || domain,
    description,
  });

  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: seo.title,
      description: seo.description,
      url: canonical,
      ...(seo.ogImage ? { images: [{ url: seo.ogImage }] } : {}),
    },
  };
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

  // Hae julkaistut blogikirjoitukset (henkilöbrändi-templaatin blogiosiolle)
  const posts = await getPublishedPosts(site.id);

  // Hae jaettu navigaatio (etusivu + alasivut + blogi)
  const chrome = await getSiteChrome(site.id);

  // Rakenna Person-strukturoitu data SEO:ta varten
  const normalized = migrateToSections(content as TemplateConfig);
  const { name, description } = extractIdentity(normalized);
  const baseUrl = await getRequestBaseUrl();
  const personJsonLd =
    name.length > 0
      ? buildPersonJsonLd({
          name,
          description: description || undefined,
          url: buildCanonicalUrl(baseUrl, "/"),
        })
      : null;

  // Hae analytiikka-asetukset
  const settings = (site.settings as Record<string, unknown>) || {};
  const gtmId = settings.googleTagManagerId as string | undefined;
  const ga4Id = settings.googleAnalyticsId as string | undefined;
  const metaPixelId = settings.metaPixelId as string | undefined;

  return (
    <>
      <ThirdPartyScripts
        gtmId={gtmId}
        ga4Id={ga4Id}
        metaPixelId={metaPixelId}
      />
      {personJsonLd && <JsonLd data={personJsonLd} />}
      <SiteRenderer
        content={content}
        siteId={createSiteId(site.id)}
        posts={posts}
        siteNav={chrome.navLinks}
        siteBrand={chrome.brand}
        currentPath="/"
      />
    </>
  );
}
