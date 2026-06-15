"use client";

import { Fragment, useState } from "react";
import type {
  TemplateConfig,
  HeroContent,
  SectionContentMap,
} from "@/src/lib/templates";
import { SECTION_TYPE_LABELS } from "@/src/lib/templates";
import { SectionEditProvider } from "@/app/components/blocks/SectionEditContext";
import { PageViewTracker } from "@/app/components/PageViewTracker";
import type { SiteId, SectionId } from "@/src/lib/types";
import type { Post } from "@/src/lib/posts";
import { migrateToSections } from "@/app/components/editor/utils/contentUtils";
import { buildGoogleFontsUrl } from "@/src/lib/fonts";
import { buildSiteThemeVars } from "@/src/lib/site-theme";
import { buildSectionContainer } from "@/src/lib/section-style";
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
  BentoBlock,
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
  /** Enables on-canvas section selection affordances (editor only). */
  editable?: boolean;
  activeSectionId?: SectionId | null;
  onSelectSection?: (sectionId: SectionId) => void;
  onMoveSection?: (sectionId: SectionId, direction: "up" | "down") => void;
  onDuplicateSection?: (sectionId: SectionId) => void;
  onRemoveSection?: (sectionId: SectionId) => void;
  /** Open the section picker to insert after the given section. */
  onRequestInsert?: (afterSectionId: SectionId) => void;
  onReorderSections?: (draggedId: SectionId, targetId: SectionId) => void;
  onUpdateSectionField?: (
    sectionId: SectionId,
    field: string,
    value: string,
  ) => void;
};

export default function SiteRenderer({
  content,
  siteId,
  isPreview = false,
  posts,
  editable = false,
  activeSectionId = null,
  onSelectSection,
  onMoveSection,
  onDuplicateSection,
  onRemoveSection,
  onRequestInsert,
  onReorderSections,
  onUpdateSectionField,
}: SiteRendererProps) {
  const [dragOverId, setDragOverId] = useState<SectionId | null>(null);
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
    ...buildSiteThemeVars(theme, normalizedContent.templateId),
    ...(theme.headingFont && {
      ["--heading-font" as string]: `'${theme.headingFont}', sans-serif`,
    }),
    ...(theme.bodyFont && {
      ["--body-font" as string]: `'${theme.bodyFont}', sans-serif`,
    }),
  };

  const isLightPortfolio = isPortfolio && !isDark;

  return (
    <div
      className="relative min-h-screen bg-background text-foreground"
      style={fontStyles}
    >
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
      {isDark && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:64px_64px]"
        />
      )}
      {isLightPortfolio && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.025)_1px,transparent_1px)] bg-[size:64px_64px]"
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
            templateId: normalizedContent.templateId,
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
              case "bento":
                return (
                  <BentoBlock
                    key={section.id}
                    {...baseProps}
                    content={section.content as SectionContentMap["bento"]}
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

          const container = buildSectionContainer(section.style);
          const styledBlock =
            container.className || container.style ? (
              <div className={container.className} style={container.style}>
                {block}
              </div>
            ) : (
              block
            );

          const showRule =
            (isDark || isLightPortfolio) &&
            index > 0 &&
            section.type !== "footer";

          return (
            <Fragment key={section.id}>
              {showRule && (
                <div className="mx-auto max-w-7xl px-6 lg:px-8">
                  <div
                    className={
                      isLightPortfolio
                        ? "portfolio-rule-light"
                        : "portfolio-rule"
                    }
                  />
                </div>
              )}
              {editable ? (
                <div
                  data-section-id={section.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectSection?.(section.id);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverId !== section.id) setDragOverId(section.id);
                  }}
                  onDragLeave={() => {
                    if (dragOverId === section.id) setDragOverId(null);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const draggedId = e.dataTransfer.getData(
                      "text/section-id",
                    ) as SectionId;
                    setDragOverId(null);
                    if (draggedId && draggedId !== section.id) {
                      onReorderSections?.(draggedId, section.id);
                    }
                  }}
                  onDragEnd={() => setDragOverId(null)}
                  className={`group relative cursor-pointer outline-offset-[-2px] transition-[outline] ${
                    dragOverId === section.id
                      ? "outline-dashed outline-2 outline-primary"
                      : section.id === activeSectionId
                        ? "outline outline-2 outline-primary"
                        : "hover:outline hover:outline-2 hover:outline-primary/40"
                  }`}
                >
                  <div className="absolute left-3 top-3 z-20 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <span
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        e.dataTransfer.setData("text/section-id", section.id);
                        e.dataTransfer.effectAllowed = "move";
                      }}
                      title="Raahaa järjestääksesi"
                      className="cursor-grab select-none rounded bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground shadow active:cursor-grabbing"
                    >
                      ⠿
                    </span>
                    <span className="pointer-events-none rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground shadow">
                      {SECTION_TYPE_LABELS[section.type]}
                    </span>
                  </div>
                  {section.id === activeSectionId && (
                    <div className="absolute right-3 top-3 z-30 flex items-center gap-1 rounded-md border border-border bg-background/95 p-1 text-foreground shadow">
                      <button
                        type="button"
                        title="Siirrä ylös"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveSection?.(section.id, "up");
                        }}
                        className="rounded px-1.5 py-0.5 text-sm hover:bg-accent"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        title="Siirrä alas"
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveSection?.(section.id, "down");
                        }}
                        className="rounded px-1.5 py-0.5 text-sm hover:bg-accent"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        title="Monista"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDuplicateSection?.(section.id);
                        }}
                        className="rounded px-1.5 py-0.5 text-sm hover:bg-accent"
                      >
                        ⧉
                      </button>
                      <button
                        type="button"
                        title="Poista"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveSection?.(section.id);
                        }}
                        className="rounded px-1.5 py-0.5 text-sm text-destructive hover:bg-accent"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <SectionEditProvider
                    editable
                    updateField={(field, value) =>
                      onUpdateSectionField?.(section.id, field, value)
                    }
                  >
                    {styledBlock}
                  </SectionEditProvider>
                  <button
                    type="button"
                    title="Lisää osio tähän"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRequestInsert?.(section.id);
                    }}
                    className="absolute -bottom-3 left-1/2 z-30 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground opacity-0 shadow transition-opacity hover:bg-primary-hover group-hover:opacity-100"
                  >
                    +
                  </button>
                </div>
              ) : (
                styledBlock
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
