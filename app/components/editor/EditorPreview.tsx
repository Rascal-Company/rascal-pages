"use client";

import { TemplateConfig } from "@/src/lib/templates";
import SiteRenderer from "@/app/components/renderer/SiteRenderer";
import type { SiteId, SectionId } from "@/src/lib/types";

interface EditorPreviewProps {
  content: TemplateConfig;
  siteId: SiteId;
  previewMode?: "desktop" | "mobile";
  /** False renders the page exactly as published, without editing affordances. */
  editable?: boolean;
  activeSectionId?: SectionId | null;
  onSelectSection?: (sectionId: SectionId) => void;
  onMoveSection?: (sectionId: SectionId, direction: "up" | "down") => void;
  onDuplicateSection?: (sectionId: SectionId) => void;
  onRemoveSection?: (sectionId: SectionId) => void;
  onRequestInsert?: (afterSectionId: SectionId) => void;
  onReorderSections?: (draggedId: SectionId, targetId: SectionId) => void;
  onUpdateSectionField?: (
    sectionId: SectionId,
    field: string,
    value: string,
  ) => void;
}

export default function EditorPreview({
  content,
  siteId,
  previewMode = "desktop",
  editable = true,
  activeSectionId = null,
  onSelectSection,
  onMoveSection,
  onDuplicateSection,
  onRemoveSection,
  onRequestInsert,
  onReorderSections,
  onUpdateSectionField,
}: EditorPreviewProps) {
  const isMobile = previewMode === "mobile";

  return (
    <div className="min-h-full w-full bg-muted p-6 lg:p-8">
      <div
        className={`mx-auto transition-all duration-300 ${
          isMobile ? "max-w-[375px]" : "max-w-full"
        }`}
      >
        <div
          className={`overflow-hidden rounded-lg border bg-card shadow-lg ${
            isMobile ? "border-4 border-foreground/70" : "border-input"
          }`}
        >
          {isMobile && (
            <div className="flex items-center justify-center bg-foreground/80 px-4 py-2">
              <div className="h-1 w-16 rounded-full bg-background/40" />
            </div>
          )}
          <SiteRenderer
            content={content}
            siteId={siteId}
            isPreview={true}
            editable={editable}
            activeSectionId={editable ? activeSectionId : null}
            onSelectSection={onSelectSection}
            onMoveSection={onMoveSection}
            onDuplicateSection={onDuplicateSection}
            onRemoveSection={onRemoveSection}
            onRequestInsert={onRequestInsert}
            onReorderSections={onReorderSections}
            onUpdateSectionField={onUpdateSectionField}
          />
          {isMobile && (
            <div className="flex items-center justify-center bg-foreground/80 px-4 py-3">
              <div className="h-10 w-10 rounded-full border-2 border-background/40" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
