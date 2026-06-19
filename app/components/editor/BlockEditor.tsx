"use client";

import type {
  Section,
  SectionContentMap,
  SectionType,
} from "@/src/lib/templates";
import {
  HeroBlockEditor,
  FeaturesBlockEditor,
  FaqBlockEditor,
  TestimonialsBlockEditor,
  AboutBlockEditor,
  VideoBlockEditor,
  FormBlockEditor,
  LogosBlockEditor,
  BlogBlockEditor,
  CasesBlockEditor,
  TechStackBlockEditor,
  BentoBlockEditor,
  PricingBlockEditor,
  FooterBlockEditor,
} from "./blocks";

type BlockEditorProps = {
  section: Section;
  onUpdate: (content: SectionContentMap[SectionType]) => void;
  crmEnabled: boolean;
};

export default function BlockEditor({
  section,
  onUpdate,
  crmEnabled,
}: BlockEditorProps) {
  return (
    <div className="space-y-4">
      {(() => {
        switch (section.type) {
          case "hero":
            return (
              <HeroBlockEditor
                content={section.content as SectionContentMap["hero"]}
                onUpdate={onUpdate}
                crmEnabled={crmEnabled}
              />
            );
          case "features":
            return (
              <FeaturesBlockEditor
                content={section.content as SectionContentMap["features"]}
                onUpdate={onUpdate}
              />
            );
          case "faq":
            return (
              <FaqBlockEditor
                content={section.content as SectionContentMap["faq"]}
                onUpdate={onUpdate}
              />
            );
          case "testimonials":
            return (
              <TestimonialsBlockEditor
                content={section.content as SectionContentMap["testimonials"]}
                onUpdate={onUpdate}
              />
            );
          case "about":
            return (
              <AboutBlockEditor
                content={section.content as SectionContentMap["about"]}
                onUpdate={onUpdate}
              />
            );
          case "video":
            return (
              <VideoBlockEditor
                content={section.content as SectionContentMap["video"]}
                onUpdate={onUpdate}
              />
            );
          case "form":
            return (
              <FormBlockEditor
                content={section.content as SectionContentMap["form"]}
                onUpdate={onUpdate}
                crmEnabled={crmEnabled}
              />
            );
          case "logos":
            return (
              <LogosBlockEditor
                content={section.content as SectionContentMap["logos"]}
                onUpdate={onUpdate}
              />
            );
          case "blog":
            return (
              <BlogBlockEditor
                content={section.content as SectionContentMap["blog"]}
                onUpdate={onUpdate}
              />
            );
          case "cases":
            return (
              <CasesBlockEditor
                content={section.content as SectionContentMap["cases"]}
                onUpdate={onUpdate}
              />
            );
          case "techStack":
            return (
              <TechStackBlockEditor
                content={section.content as SectionContentMap["techStack"]}
                onUpdate={onUpdate}
              />
            );
          case "bento":
            return (
              <BentoBlockEditor
                content={section.content as SectionContentMap["bento"]}
                onUpdate={onUpdate}
              />
            );
          case "pricing":
            return (
              <PricingBlockEditor
                content={section.content as SectionContentMap["pricing"]}
                onUpdate={onUpdate}
              />
            );
          case "footer":
            return (
              <FooterBlockEditor
                content={section.content as SectionContentMap["footer"]}
                onUpdate={onUpdate}
              />
            );
          default:
            return <p className="text-sm text-gray-500">Ei muokattavaa.</p>;
        }
      })()}
    </div>
  );
}
