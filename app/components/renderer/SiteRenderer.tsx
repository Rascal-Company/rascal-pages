"use client";

import { TemplateConfig, getDefaultTemplate } from "@/src/lib/templates";
import LeadMagnetTemplate from "@/app/components/templates/LeadMagnetTemplate";
import WaitlistTemplate from "@/app/components/templates/WaitlistTemplate";
import SaasModernTemplate from "@/app/components/templates/SaasModernTemplate";
import VslTemplate from "@/app/components/templates/VslTemplate";
import PersonalTemplate from "@/app/components/templates/PersonalTemplate";
import { PageViewTracker } from "@/app/components/PageViewTracker";

interface SiteRendererProps {
  content: TemplateConfig | any; // Tuki vanhalle muodolle myös
  siteId: string;
}

export default function SiteRenderer({ content, siteId }: SiteRendererProps) {
  // Normalisoi content - varmista että templateId on olemassa
  let normalizedContent: TemplateConfig;

  // Jos sisällössä ei ole templateId, käytetään vanhaa muotoa ja oletustemplatea
  if (!content.templateId) {
    const defaultTemplate = getDefaultTemplate();
    normalizedContent = {
      ...defaultTemplate.defaultContent,
      hero: {
        ...defaultTemplate.defaultContent.hero,
        ...content.hero,
        ctaText:
          content.hero?.cta ||
          content.hero?.ctaText ||
          defaultTemplate.defaultContent.hero.ctaText,
        cta:
          content.hero?.cta ||
          content.hero?.ctaText ||
          defaultTemplate.defaultContent.hero.ctaText,
      },
      features:
        content.features || defaultTemplate.defaultContent.features || [],
      theme: content.theme || defaultTemplate.defaultContent.theme,
    };
  } else {
    normalizedContent = content as TemplateConfig;
  }

  // Renderöi oikea template komponentti templateId:n perusteella
  const templateId = normalizedContent.templateId || "saas-modern";

  return (
    <>
      <PageViewTracker siteId={siteId} />
      {(() => {
        switch (templateId) {
          case "lead-magnet":
            return (
              <LeadMagnetTemplate content={normalizedContent} siteId={siteId} />
            );
          case "waitlist":
            return (
              <WaitlistTemplate content={normalizedContent} siteId={siteId} />
            );
          case "vsl":
            return <VslTemplate content={normalizedContent} siteId={siteId} />;
          case "personal":
            return (
              <PersonalTemplate content={normalizedContent} siteId={siteId} />
            );
          case "saas-modern":
          default:
            return (
              <SaasModernTemplate content={normalizedContent} siteId={siteId} />
            );
        }
      })()}
    </>
  );
}
