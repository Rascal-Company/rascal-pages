"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  moveSection,
  updateThemeColor,
  updateThemeFont,
  updateThemeAppearance,
  updateSeoField,
  applyThemePreset,
  updateThemeRadius,
} from "./utils/sectionUpdaters";
import type { SiteId, SectionId } from "@/src/lib/types";
import { useToast } from "@/app/components/ui/ToastContainer";
import EditorHeader from "./EditorHeader";
import StatusMessages from "./StatusMessages";
import TemplateSelector from "./TemplateSelector";
import ThemeFields from "./fields/ThemeFields";
import StyleFields from "./fields/StyleFields";
import SeoFields from "./fields/SeoFields";
import SaveButton from "./SaveButton";
import EditorPreview from "./EditorPreview";
import PublishedToggle from "./PublishedToggle";
import SortableSectionItem from "./SortableSectionItem";
import BlockEditor from "./BlockEditor";
import AddSectionButton from "./AddSectionButton";
import SectionPicker from "./SectionPicker";
import SettingsModal from "./SettingsModal";
import SaveStatusIndicator from "./SaveStatusIndicator";
import { EditorSiteProvider } from "./EditorSiteContext";
import { useHistoryState } from "./hooks/useHistoryState";
import { useAutosave } from "./hooks/useAutosave";

type EditorProps = {
  siteId: SiteId;
  pageId: string | null;
  siteSubdomain: string;
  siteCustomDomain?: string | null;
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
  siteCustomDomain = null,
  initialContent,
  initialPublished = false,
  initialSettings = {},
}: EditorProps) {
  const { showToast, showConfirm } = useToast();
  const {
    state: content,
    set: setContent,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<TemplateConfig>(normalizeContent(initialContent));
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
  const [insertAfterId, setInsertAfterId] = useState<SectionId | null>(null);

  const rootDomain = "rascalpages.fi";

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const pageState = useMemo(
    () => ({ content, published }),
    [content, published],
  );

  const persist = useCallback(
    (data: { content: TemplateConfig; published: boolean }) =>
      updatePageContent(siteId, data.content, data.published),
    [siteId],
  );

  const {
    status: saveStatus,
    lastSavedAt,
    markSaved,
  } = useAutosave({ data: pageState, onSave: persist });

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await persist(pageState);
      if (result?.error) {
        setError(result.error);
        showToast(result.error, "error");
      } else {
        setSuccess(true);
        markSaved(pageState);
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

  // Undo/redo keyboard shortcuts (Cmd/Ctrl+Z, Cmd/Ctrl+Shift+Z, Ctrl+Y)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo]);

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

  const handleInsertSection = (type: SectionType) => {
    if (insertAfterId === null) return;
    setContent(addSection(type, insertAfterId));
    setInsertAfterId(null);
  };

  const handleRemoveSection = (sectionId: SectionId) => {
    setContent(removeSection(sectionId));
    if (activeSectionId === sectionId) {
      setActiveSectionId(content.sections[0]?.id || null);
    }
  };

  const activeSection = content.sections.find((s) => s.id === activeSectionId);

  return (
    <EditorSiteProvider siteId={siteId}>
      <div className="flex h-screen bg-background">
      {/* Left Sidebar - Section List (25%) */}
      {!isFullPreview && (
        <div className="w-1/4 min-w-[250px] max-w-[350px] overflow-y-auto border-r border-border bg-card p-4">
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
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-foreground">Osiot</h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={undo}
                    disabled={!canUndo}
                    title="Kumoa (Ctrl/Cmd+Z)"
                    aria-label="Kumoa"
                    className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
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
                        d="M9 14L4 9l5-5M4 9h11a5 5 0 015 5v0a5 5 0 01-5 5h-1"
                      />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={redo}
                    disabled={!canRedo}
                    title="Tee uudelleen (Ctrl/Cmd+Shift+Z)"
                    aria-label="Tee uudelleen"
                    className="rounded-md border border-border p-1.5 text-muted-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-40"
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
                        d="M15 14l5-5-5-5m5 5H9a5 5 0 00-5 5v0a5 5 0 005 5h1"
                      />
                    </svg>
                  </button>
                </div>
              </div>
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

            <StyleFields
              radius={content.theme?.radius}
              onPreset={(preset) => setContent(applyThemePreset(preset))}
              onRadiusUpdate={(radius) => setContent(updateThemeRadius(radius))}
            />

            <ThemeFields
              primaryColor={content.theme?.primaryColor}
              headingFont={content.theme?.headingFont}
              bodyFont={content.theme?.bodyFont}
              appearance={content.theme?.appearance}
              onColorUpdate={(value) => setContent(updateThemeColor(value))}
              onFontUpdate={(field, fontName) =>
                setContent(updateThemeFont(field, fontName))
              }
              onAppearanceUpdate={(appearance) =>
                setContent(updateThemeAppearance(appearance))
              }
            />

            <SeoFields
              metaTitle={content.seo?.metaTitle}
              metaDescription={content.seo?.metaDescription}
              ogImage={content.seo?.ogImage}
              onUpdate={(field, value) =>
                setContent(updateSeoField(field, value))
              }
            />

            <div className="flex justify-end">
              <SaveStatusIndicator
                status={saveStatus}
                lastSavedAt={lastSavedAt}
              />
            </div>

            <SaveButton isSaving={isSaving} onSave={handleSave} />
          </div>
        </div>
      )}

      {/* Middle Panel - Section Editor (25%) */}
      {!isFullPreview && (
        <div className="w-1/4 min-w-[300px] max-w-[400px] overflow-y-auto border-r border-border bg-card p-4">
          {activeSection ? (
            <BlockEditor
              section={activeSection}
              onUpdate={handleSectionUpdate}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
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
          <div className="flex rounded-lg border border-border bg-card shadow-sm">
            <button
              onClick={() => setPreviewMode("desktop")}
              className={`flex items-center gap-1 px-3 py-2 text-sm font-medium transition-colors ${
                previewMode === "desktop"
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
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
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              } rounded-r-lg border-l border-border`}
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
            className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent"
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
          activeSectionId={activeSectionId}
          onSelectSection={setActiveSectionId}
          onMoveSection={(id, dir) => setContent(moveSection(id, dir))}
          onDuplicateSection={(id) => setContent(duplicateSection(id))}
          onRemoveSection={handleRemoveSection}
          onRequestInsert={(afterId) => setInsertAfterId(afterId)}
        />
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        siteId={siteId}
        subdomain={siteSubdomain}
        rootDomain={rootDomain}
        customDomain={siteCustomDomain}
        initialSettings={initialSettings}
      />

      <SectionPicker
        open={insertAfterId !== null}
        onClose={() => setInsertAfterId(null)}
        onPick={handleInsertSection}
      />
      </div>
    </EditorSiteProvider>
  );
}
