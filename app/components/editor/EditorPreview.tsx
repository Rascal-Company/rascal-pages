"use client";

import { TemplateConfig } from "@/src/lib/templates";
import SiteRenderer from "@/app/components/renderer/SiteRenderer";
import type { SiteId, SectionId } from "@/src/lib/types";

interface EditorPreviewProps {
  content: TemplateConfig;
  siteId: SiteId;
  previewMode?: "desktop" | "mobile";
  activeSectionId?: SectionId | null;
  onSelectSection?: (sectionId: SectionId) => void;
  onMoveSection?: (sectionId: SectionId, direction: "up" | "down") => void;
  onDuplicateSection?: (sectionId: SectionId) => void;
  onRemoveSection?: (sectionId: SectionId) => void;
  onRequestInsert?: (afterSectionId: SectionId) => void;
  onReorderSections?: (draggedId: SectionId, targetId: SectionId) => void;
}

export default function EditorPreview({
  content,
  siteId,
  previewMode = "desktop",
  activeSectionId = null,
  onSelectSection,
  onMoveSection,
  onDuplicateSection,
  onRemoveSection,
  onRequestInsert,
  onReorderSections,
}: EditorPreviewProps) {
  const isMobile = previewMode === "mobile";

  return (
    <div className="h-full w-full bg-muted p-8 pt-16">
      <div
        className={`mx-auto transition-all duration-300 ${
          isMobile ? "max-w-[375px]" : "max-w-full"
        }`}
      >
        <div
          className={`rounded-lg border bg-card shadow-lg overflow-hidden ${
            isMobile ? "border-gray-400 border-4" : "border-input"
          }`}
        >
          {isMobile && (
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-center">
              <div className="w-16 h-1 bg-gray-600 rounded-full" />
            </div>
          )}
          <SiteRenderer
            content={content}
            siteId={siteId}
            isPreview={true}
            editable={true}
            activeSectionId={activeSectionId}
            onSelectSection={onSelectSection}
            onMoveSection={onMoveSection}
            onDuplicateSection={onDuplicateSection}
            onRemoveSection={onRemoveSection}
            onRequestInsert={onRequestInsert}
            onReorderSections={onReorderSections}
          />
          {isMobile && (
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-gray-600 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
