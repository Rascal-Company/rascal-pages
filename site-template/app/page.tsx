import type { Metadata } from "next";
import { loadPosts, loadSiteConfig } from "@/lib/content";
import SiteRenderer from "@/components/SiteRenderer";
import JsonLd from "@/components/JsonLd";
import { buildCanonicalUrl, buildPersonJsonLd } from "@/lib/seo";
import type { AboutContent, HeroContent, TemplateConfig } from "@/lib/templates";

/**
 * Pull a display name + description from the about section, falling back to hero.
 */
function extractIdentity(template: TemplateConfig): {
  name: string;
  description: string;
} {
  const about = template.sections.find((s) => s.type === "about")?.content as
    | AboutContent
    | undefined;
  const hero = template.sections.find((s) => s.type === "hero")?.content as
    | HeroContent
    | undefined;

  return {
    name: about?.name || hero?.title || "",
    description: about?.bio || hero?.subtitle || "",
  };
}

export function generateMetadata(): Metadata {
  const { meta, template } = loadSiteConfig();
  const { name, description } = extractIdentity(template);
  const canonical = buildCanonicalUrl(meta.url, "/");

  return {
    title: meta.name || name,
    description: description || undefined,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title: meta.name || name,
      description: description || undefined,
      url: canonical,
    },
  };
}

export default function HomePage() {
  const { meta, template } = loadSiteConfig();
  const posts = loadPosts();
  const { name, description } = extractIdentity(template);

  const personJsonLd =
    name.length > 0
      ? buildPersonJsonLd({
          name,
          description: description || undefined,
          url: buildCanonicalUrl(meta.url, "/"),
        })
      : null;

  return (
    <>
      {personJsonLd && <JsonLd data={personJsonLd} />}
      <SiteRenderer template={template} posts={posts} siteName={meta.name} />
    </>
  );
}
