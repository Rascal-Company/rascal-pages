"use client";

import { TemplateConfig } from "@/src/lib/templates";
import SiteRenderer from "@/app/components/renderer/SiteRenderer";
import type { SiteId, SectionId } from "@/src/lib/types";
import { cn } from "@/src/lib/utils";
import PreviewFrame from "./PreviewFrame";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

interface EditorPreviewProps {
  content: TemplateConfig;
  siteId: SiteId;
  previewMode?: PreviewDevice;
  /** false = koko näytön esikatselu ilman muokkaustyökaluja. */
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

const DEVICE_WIDTH: Record<PreviewDevice, string> = {
  desktop: "100%",
  tablet: "834px",
  mobile: "390px",
};

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
  const framed = previewMode !== "desktop";

  return (
    <div className="flex h-full w-full justify-center overflow-hidden bg-muted/70 p-3 sm:p-5">
      <div
        className={cn(
          "h-full overflow-hidden bg-white shadow-xl shadow-black/10 ring-1 ring-border transition-[width,border-radius] duration-300 ease-out motion-reduce:transition-none",
          framed ? "rounded-[2rem] ring-[6px] ring-foreground/85" : "rounded-xl",
        )}
        style={{ width: DEVICE_WIDTH[previewMode], maxWidth: "100%" }}
      >
        <PreviewFrame title="Sivun esikatselu" className="block size-full border-0">
          <SiteRenderer
            content={content}
            siteId={siteId}
            isPreview={true}
            editable={editable}
            activeSectionId={activeSectionId}
            onSelectSection={onSelectSection}
            onMoveSection={onMoveSection}
            onDuplicateSection={onDuplicateSection}
            onRemoveSection={onRemoveSection}
            onRequestInsert={onRequestInsert}
            onReorderSections={onReorderSections}
            onUpdateSectionField={onUpdateSectionField}
          />
        </PreviewFrame>
      </div>
    </div>
  );
}
