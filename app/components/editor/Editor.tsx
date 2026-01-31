"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { updatePageContent } from "@/app/actions/save-page";
import type { TemplateConfig, SectionType, Section } from "@/src/lib/templates";
import { normalizeContent, mergeTemplateContent } from "./utils/contentUtils";
import {
  reorderSections,
  updateSectionContent,
  toggleSectionVisibility,
  addSection,
  removeSection,
  duplicateSection,
  updateThemeColor,
} from "./utils/sectionUpdaters";
import type { SiteId, SectionId } from "@/src/lib/types";
import { useToast } from "@/app/components/ui/ToastContainer";
import EditorHeader from "./EditorHeader";
import StatusMessages from "./StatusMessages";
import TemplateSelector from "./TemplateSelector";
import ThemeFields from "./fields/ThemeFields";
import SaveButton from "./SaveButton";
import EditorPreview from "./EditorPreview";
import PublishedToggle from "./PublishedToggle";
import SortableSectionItem from "./SortableSectionItem";
import BlockEditor from "./BlockEditor";
import AddSectionButton from "./AddSectionButton";
import SettingsModal from "./SettingsModal";

type EditorProps = {
  siteId: SiteId;
  pageId: string | null;
  siteSubdomain: string;
  initialContent: TemplateConfig | Record<string, unknown>;
  initialPublished?: boolean;
  initialSettings?: {
    googleTagManagerId?: string;
    googleAnalyticsId?: string;
    metaPixelId?: string;
  };
};

export default function Editor({
  siteId,
  pageId: _pageId,
  siteSubdomain,
  initialContent,
  initialPublished = false,
  initialSettings = {},
}: EditorProps) {
  const { showToast, showConfirm } = useToast();
  const [content, setContent] = useState<TemplateConfig>(
    normalizeContent(initialContent),
  );
  const [published, setPublished] = useState<boolean>(initialPublished);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<SectionId | null>(
    content.sections[0]?.id || null,
  );
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">(
    "desktop",
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const rootDomain = "rascalpages.fi";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updatePageContent(siteId, content, published);
      if (result?.error) {
        setError(result.error);
        showToast(result.error, "error");
      } else {
        setSuccess(true);
        showToast("Muutokset tallennettu onnistuneesti!", "success");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      const errorMessage = "Tallennus epäonnistui. Yritä uudelleen.";
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTemplateChange = async (newTemplateId: string) => {
    if (newTemplateId === content.templateId) return;

    const confirmed = await showConfirm(
      "Olet vaihtamassa templatea. Tämä voi muuttaa sivun rakennetta ja poistaa osan datasta. Haluatko jatkaa?",
      () => {},
    );

    if (confirmed) {
      const mergedContent = mergeTemplateContent(content, newTemplateId);
      if (mergedContent) {
        setContent(mergedContent);
        setActiveSectionId(mergedContent.sections[0]?.id || null);
        showToast("Template vaihdettu onnistuneesti!", "success");
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setContent(reorderSections(active.id as SectionId, over.id as SectionId));
    }
  };

  const handleSectionUpdate = (newContent: Section["content"]) => {
    if (activeSectionId) {
      setContent(updateSectionContent(activeSectionId, newContent));
    }
  };

  const handleAddSection = (type: SectionType) => {
    setContent(addSection(type, activeSectionId || undefined));
  };

  const handleRemoveSection = (sectionId: SectionId) => {
    setContent(removeSection(sectionId));
    if (activeSectionId === sectionId) {
      setActiveSectionId(content.sections[0]?.id || null);
    }
  };

  const activeSection = content.sections.find((s) => s.id === activeSectionId);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Section List (25%) */}
      {!isFullPreview && (
        <div className="w-1/4 min-w-[250px] max-w-[350px] overflow-y-auto border-r border-gray-200 bg-white p-4">
          <EditorHeader
            siteSubdomain={siteSubdomain}
            onSettingsClick={() => setIsSettingsOpen(true)}
          />
          <StatusMessages error={error} success={success} />

          <div className="space-y-4">
            <TemplateSelector
              currentTemplateId={content.templateId || "saas-modern"}
              onTemplateChange={handleTemplateChange}
            />

            <PublishedToggle
              published={published}
              onToggle={setPublished}
              isSaving={isSaving}
            />

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Osiot</h3>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={content.sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {content.sections.map((section) => (
                      <SortableSectionItem
                        key={section.id}
                        section={section}
                        isActive={section.id === activeSectionId}
                        onClick={() => setActiveSectionId(section.id)}
                        onToggleVisibility={() =>
                          setContent(toggleSectionVisibility(section.id))
                        }
                        onRemove={() => handleRemoveSection(section.id)}
                        onDuplicate={() =>
                          setContent(duplicateSection(section.id))
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
              <AddSectionButton onAdd={handleAddSection} />
            </div>

            <ThemeFields
              primaryColor={content.theme?.primaryColor}
              onUpdate={(value) => setContent(updateThemeColor(value))}
            />

            <SaveButton isSaving={isSaving} onSave={handleSave} />
          </div>
        </div>
      )}

      {/* Middle Panel - Section Editor (25%) */}
      {!isFullPreview && (
        <div className="w-1/4 min-w-[300px] max-w-[400px] overflow-y-auto border-r border-gray-200 bg-white p-4">
          {activeSection ? (
            <BlockEditor
              section={activeSection}
              onUpdate={handleSectionUpdate}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-500">
              Valitse osio vasemmalta muokataksesi sitä
            </div>
          )}
        </div>
      )}

      {/* Right Side - Preview */}
      <div className="relative flex-1 overflow-y-auto">
        {/* Preview Controls */}
        <div
          className={`absolute top-4 z-10 flex items-center gap-2 ${
            isFullPreview ? "left-4" : "right-4"
          }`}
        >
          {/* Device Toggle */}
          <div className="flex rounded-lg border border-gray-200 bg-white shadow-sm">
            <button
              onClick={() => setPreviewMode("desktop")}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                previewMode === "desktop"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } rounded-l-lg`}
              title="Desktop"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setPreviewMode("mobile")}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                previewMode === "mobile"
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:text-gray-700"
              } rounded-r-lg border-l border-gray-200`}
              title="Mobile"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </button>
          </div>

          {/* Full Preview Toggle */}
          <button
            onClick={() => setIsFullPreview(!isFullPreview)}
            className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
            title={isFullPreview ? "Näytä editori" : "Koko näytön esikatselu"}
          >
            {isFullPreview ? (
              <>
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                  />
                </svg>
                Editori
              </>
            ) : (
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
            )}
          </button>
        </div>
        <EditorPreview
          content={content}
          siteId={siteId}
          previewMode={previewMode}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        siteId={siteId}
        subdomain={siteSubdomain}
        rootDomain={rootDomain}
        initialSettings={initialSettings}
      />
    </div>
  );
}
