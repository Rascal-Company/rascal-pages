"use client";

import type {
  Section,
  SectionContentMap,
  SectionType,
} from "@/src/lib/templates";
import { SECTION_TYPE_LABELS } from "@/src/lib/templates";
import {
  HeroBlockEditor,
  FeaturesBlockEditor,
  FaqBlockEditor,
  TestimonialsBlockEditor,
  AboutBlockEditor,
  VideoBlockEditor,
  FormBlockEditor,
  LogosBlockEditor,
  FooterBlockEditor,
} from "./blocks";

type BlockEditorProps = {
  section: Section;
  onUpdate: (content: SectionContentMap[SectionType]) => void;
};

export default function BlockEditor({ section, onUpdate }: BlockEditorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">
        {SECTION_TYPE_LABELS[section.type]}
      </h3>
      {(() => {
        switch (section.type) {
          case "hero":
            return (
              <HeroBlockEditor
                content={section.content as SectionContentMap["hero"]}
                onUpdate={onUpdate}
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
              />
            );
          case "logos":
            return (
              <LogosBlockEditor
                content={section.content as SectionContentMap["logos"]}
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
