"use client";

import { Fragment } from "react";
import type {
  TemplateConfig,
  HeroContent,
  SectionContentMap,
} from "@/src/lib/templates";
import { PageViewTracker } from "@/app/components/PageViewTracker";
import type { SiteId } from "@/src/lib/types";
import type { Post } from "@/src/lib/posts";
import { migrateToSections } from "@/app/components/editor/utils/contentUtils";
import { buildGoogleFontsUrl } from "@/src/lib/fonts";
import { isDarkAppearance } from "@/app/components/blocks/appearance";
import {
  HeroBlock,
  FeaturesBlock,
  FaqBlock,
  TestimonialsBlock,
  AboutBlock,
  VideoBlock,
  FormBlock,
  LogosBlock,
  BlogListBlock,
  CasesBlock,
  TechStackBlock,
  PortfolioNav,
  FooterBlock,
} from "@/app/components/blocks";
import type { PortfolioNavItem } from "@/app/components/blocks/PortfolioNav";
import type { CasesContent, TechStackContent } from "@/src/lib/templates";

type SiteRendererProps = {
  content: TemplateConfig | Record<string, unknown> | null | undefined;
  siteId: SiteId;
  isPreview?: boolean;
  posts?: Post[];
};

export default function SiteRenderer({
  content,
  siteId,
  isPreview = false,
  posts,
}: SiteRendererProps) {
  const normalizedContent = migrateToSections(content);
  const { sections, theme } = normalizedContent;

  const heroSection = sections.find((s) => s.type === "hero");
  const heroContent = heroSection?.content as HeroContent | undefined;

  const fontsUrl = buildGoogleFontsUrl(theme.headingFont, theme.bodyFont);
  const isDark = isDarkAppearance(theme);
  const isPortfolio = normalizedContent.templateId === "portfolio";
  const hasPosts = (posts?.length ?? 0) > 0;

  const visibleSections = sections.filter((section) => section.isVisible);

  const navItems: PortfolioNavItem[] = [];
  let navCta: PortfolioNavItem | undefined;
  if (isPortfolio) {
    for (const section of visibleSections) {
      if (section.type === "about") {
        navItems.push({ label: "Tarina", href: "#tarina" });
      } else if (section.type === "techStack") {
        const heading = (section.content as TechStackContent)?.heading;
        navItems.push({ label: heading || "Osaaminen", href: "#osaaminen" });
      } else if (section.type === "cases") {
        const heading = (section.content as CasesContent)?.heading;
        navItems.push({ label: heading || "Työt", href: "#projektit" });
      } else if (section.type === "blog" && (hasPosts || isPreview)) {
        navItems.push({ label: "Blogi", href: "#blogi" });
      } else if (section.type === "form") {
        navCta = { label: "Ota yhteyttä", href: "#yhteys" };
      }
    }
  }

  const fontStyles: React.CSSProperties = {
    scrollBehavior: "smooth",
    ...(theme.headingFont && {
      ["--heading-font" as string]: `'${theme.headingFont}', sans-serif`,
    }),
    ...(theme.bodyFont && {
      ["--body-font" as string]: `'${theme.bodyFont}', sans-serif`,
    }),
  };

  return (
    <div
      className={`relative min-h-screen ${
        isDark ? "bg-[#0a0a0b] text-[#f5f5f7]" : "bg-white"
      }`}
      style={fontStyles}
    >
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
      {isDark && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"
        />
      )}
      <div className="relative">
        {!isPreview && <PageViewTracker siteId={siteId} />}
        {isPortfolio && heroContent && (
          <PortfolioNav
            name={heroContent.title || "Portfolio"}
            items={navItems}
            cta={navCta}
            theme={theme}
          />
        )}
        {visibleSections.map((section, index) => {
          const baseProps = {
            theme,
            siteId,
            isPreview,
          };

          const block = (() => {
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
                    content={
                      section.content as SectionContentMap["testimonials"]
                    }
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
              case "blog":
                return (
                  <BlogListBlock
                    key={section.id}
                    {...baseProps}
                    content={section.content as SectionContentMap["blog"]}
                    posts={posts}
                  />
                );
              case "cases":
                return (
                  <CasesBlock
                    key={section.id}
                    {...baseProps}
                    content={section.content as SectionContentMap["cases"]}
                  />
                );
              case "techStack":
                return (
                  <TechStackBlock
                    key={section.id}
                    {...baseProps}
                    content={section.content as SectionContentMap["techStack"]}
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
          })();

          if (!block) return null;

          const showRule = isDark && index > 0 && section.type !== "footer";

          return (
            <Fragment key={section.id}>
              {showRule && (
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                  <div className="portfolio-rule" />
                </div>
              )}
              {block}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
