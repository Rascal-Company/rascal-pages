"use client";

import type {
  TemplateConfig,
  HeroContent,
  SectionContentMap,
  SectionType,
} from "@/src/lib/templates";
import { PageViewTracker } from "@/app/components/PageViewTracker";
import type { SiteId } from "@/src/lib/types";
import { migrateToSections } from "@/app/components/editor/utils/contentUtils";
import {
  HeroBlock,
  FeaturesBlock,
  FaqBlock,
  TestimonialsBlock,
  AboutBlock,
  VideoBlock,
  FormBlock,
  LogosBlock,
  FooterBlock,
} from "@/app/components/blocks";

type SiteRendererProps = {
  content: TemplateConfig | Record<string, unknown> | null | undefined;
  siteId: SiteId;
  isPreview?: boolean;
};

export default function SiteRenderer({
  content,
  siteId,
  isPreview = false,
}: SiteRendererProps) {
  const normalizedContent = migrateToSections(content);
  const { sections, theme } = normalizedContent;

  const heroSection = sections.find((s) => s.type === "hero");
  const heroContent = heroSection?.content as HeroContent | undefined;

  return (
    <div className="min-h-screen bg-white">
      {!isPreview && <PageViewTracker siteId={siteId} />}
      {sections
        .filter((section) => section.isVisible)
        .map((section) => {
          const baseProps = {
            key: section.id,
            theme,
            siteId,
            isPreview,
          };

          switch (section.type) {
            case "hero":
              return (
                <HeroBlock
                  {...baseProps}
                  content={section.content as SectionContentMap["hero"]}
                />
              );
            case "features":
              return (
                <FeaturesBlock
                  {...baseProps}
                  content={section.content as SectionContentMap["features"]}
                />
              );
            case "faq":
              return (
                <FaqBlock
                  {...baseProps}
                  content={section.content as SectionContentMap["faq"]}
                />
              );
            case "testimonials":
              return (
                <TestimonialsBlock
                  {...baseProps}
                  content={section.content as SectionContentMap["testimonials"]}
                />
              );
            case "about":
              return (
                <AboutBlock
                  {...baseProps}
                  content={section.content as SectionContentMap["about"]}
                />
              );
            case "video":
              return (
                <VideoBlock
                  {...baseProps}
                  content={section.content as SectionContentMap["video"]}
                />
              );
            case "form":
              return (
                <FormBlock
                  {...baseProps}
                  content={section.content as SectionContentMap["form"]}
                  hero={heroContent}
                />
              );
            case "logos":
              return (
                <LogosBlock
                  {...baseProps}
                  content={section.content as SectionContentMap["logos"]}
                />
              );
            case "footer":
              return (
                <FooterBlock
                  {...baseProps}
                  content={section.content as SectionContentMap["footer"]}
                />
              );
            default:
              return null;
          }
        })}
    </div>
  );
}
