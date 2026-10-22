"use client";

import type { ReactNode } from "react";
import type {
  HeroContent,
  Section,
  SectionContentMap,
  ThemeConfig,
} from "@/src/lib/templates";
import type { SiteId, SectionId } from "@/src/lib/types";
import type { Post } from "@/src/lib/posts";
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
  PricingBlock,
  GalleryBlock,
  CtaBlock,
  FooterBlock,
} from "@/app/components/blocks";
import FluidSection from "@/app/components/blocks/fluid/FluidSection";

export type SectionRenderContext = {
  baseProps: {
    theme: ThemeConfig;
    siteId: SiteId;
    isPreview: boolean;
    templateId?: string;
  };
  heroContent?: HeroContent;
  posts?: Post[];
  activeSectionId?: SectionId | null;
};

/**
 * Renderöi yhden osion sisällön tyypin mukaan. Käytössä sekä sivun osioissa
 * että vapaan osion komponenttilohkoissa (valmis osio ruudukon sisällä).
 */
export function renderSectionBlock(
  section: Pick<Section, "id" | "type" | "content">,
  ctx: SectionRenderContext,
): ReactNode {
  const { baseProps, heroContent, posts, activeSectionId } = ctx;
  switch (section.type) {
    case "fluid":
      return (
        <FluidSection
          key={section.id}
          sectionId={section.id}
          content={section.content as SectionContentMap["fluid"]}
          active={section.id === activeSectionId}
        />
      );
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
    case "pricing":
      return (
        <PricingBlock
          key={section.id}
          {...baseProps}
          content={section.content as SectionContentMap["pricing"]}
        />
      );
    case "gallery":
      return (
        <GalleryBlock
          key={section.id}
          {...baseProps}
          content={section.content as SectionContentMap["gallery"]}
        />
      );
    case "cta":
      return (
        <CtaBlock
          key={section.id}
          {...baseProps}
          content={section.content as SectionContentMap["cta"]}
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
}
