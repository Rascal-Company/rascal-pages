"use client";

import type {
  TemplateConfig,
  HeroContent,
  SectionContentMap,
} from "@/src/lib/templates";
import { PageViewTracker } from "@/app/components/PageViewTracker";
import type { SiteId } from "@/src/lib/types";
import { migrateToSections } from "@/app/components/editor/utils/contentUtils";
import { buildGoogleFontsUrl } from "@/src/lib/fonts";
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

  const fontsUrl = buildGoogleFontsUrl(theme.headingFont, theme.bodyFont);

  const fontStyles: React.CSSProperties = {
    ...(theme.headingFont && {
      ["--heading-font" as string]: `'${theme.headingFont}', sans-serif`,
    }),
    ...(theme.bodyFont && {
      ["--body-font" as string]: `'${theme.bodyFont}', sans-serif`,
    }),
  };

  return (
    <div className="min-h-screen bg-white" style={fontStyles}>
      {fontsUrl && (
        <link rel="stylesheet" href={fontsUrl} />
      )}
      {!isPreview && <PageViewTracker siteId={siteId} />}
      {sections
        .filter((section) => section.isVisible)
        .map((section) => {
          const baseProps = {
            theme,
            siteId,
            isPreview,
          };

          switch (section.type) {
            case "hero":
              return (
                <HeroBlock
                  key={section.id}
                  {...baseProps}
                  content={section.content as SectionContentMap["hero"]}
                />
              );
            case "features":
              return (
                <FeaturesBlock
                  key={section.id}
                  {...baseProps}
                  content={section.content as SectionContentMap["features"]}
                />
              );
            case "faq":
              return (
                <FaqBlock
                  key={section.id}
                  {...baseProps}
                  content={section.content as SectionContentMap["faq"]}
                />
              );
            case "testimonials":
              return (
                <TestimonialsBlock
                  key={section.id}
                  {...baseProps}
                  content={section.content as SectionContentMap["testimonials"]}
                />
              );
            case "about":
              return (
                <AboutBlock
                  key={section.id}
                  {...baseProps}
                  content={section.content as SectionContentMap["about"]}
                />
              );
            case "video":
              return (
                <VideoBlock
                  key={section.id}
                  {...baseProps}
                  content={section.content as SectionContentMap["video"]}
                />
              );
            case "form":
              return (
                <FormBlock
                  key={section.id}
                  {...baseProps}
                  content={section.content as SectionContentMap["form"]}
                  hero={heroContent}
                />
              );
            case "logos":
              return (
                <LogosBlock
                  key={section.id}
                  {...baseProps}
                  content={section.content as SectionContentMap["logos"]}
                />
              );
            case "footer":
              return (
                <FooterBlock
                  key={section.id}
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
