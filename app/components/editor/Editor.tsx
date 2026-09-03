"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { updatePageContent } from "@/app/actions/save-page";
import type { TemplateConfig, SectionType, Section } from "@/src/lib/templates";
import { SECTION_TYPE_LABELS } from "@/src/lib/templates";
import { normalizeContent, mergeTemplateContent } from "./utils/contentUtils";
import {
  reorderSections,
  updateSectionContent,
  toggleSectionVisibility,
  addSection,
  insertSectionAt,
  removeSection,
  duplicateSection,
  moveSection,
  updateSectionStyle,
  updateThemeColor,
  updateThemeFont,
  updateThemeAppearance,
  updateSeoField,
  applyThemePreset,
  updateThemeRadius,
} from "./utils/sectionUpdaters";
import { isTypingTarget, resolveShortcut } from "./utils/shortcuts";
import type { SiteId, SectionId } from "@/src/lib/types";
import { useToast } from "@/app/components/ui/ToastContainer";
import { Button } from "@/app/components/ui/button";
import EditorTopBar, { type PreviewMode } from "./EditorTopBar";
import TemplateSelector from "./TemplateSelector";
import ThemeFields from "./fields/ThemeFields";
import StyleFields from "./fields/StyleFields";
import SeoFields from "./fields/SeoFields";
import EditorPreview from "./EditorPreview";
import FloatingSectionEditor from "./FloatingSectionEditor";
import SectionPicker from "./SectionPicker";
import SectionsPanel from "./SectionsPanel";
import SettingsModal from "./SettingsModal";
import ShortcutHelpDialog from "./ShortcutHelpDialog";
import { EditorSiteProvider } from "./EditorSiteContext";
import { SitePagesProvider } from "./SitePagesContext";
import { useHistoryState } from "./hooks/useHistoryState";
import { useAutosave } from "./hooks/useAutosave";

type EditorProps = {
  siteId: SiteId;
  pageId: string | null;
  pageSlug?: string;
  pageTitle?: string;
  siteSubdomain: string;
  siteCustomDomain?: string | null;
  initialContent: TemplateConfig | Record<string, unknown>;
  initialPublished?: boolean;
  initialSettings?: {
    googleTagManagerId?: string;
    googleAnalyticsId?: string;
    metaPixelId?: string;
  };
  crmEnabled: boolean;
};

type SidebarTab = "sections" | "design" | "seo";

const SIDEBAR_TABS: { id: SidebarTab; label: string }[] = [
  { id: "sections", label: "Osiot" },
  { id: "design", label: "Ulkoasu" },
  { id: "seo", label: "SEO" },
];

/** Where a picked section goes: after a given section, or at the page end. */
type InsertTarget = { afterId: SectionId | null };

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi";

export default function Editor({
  siteId,
  pageId: _pageId,
  pageSlug = "home",
  pageTitle = "Etusivu",
  siteSubdomain,
  siteCustomDomain = null,
  initialContent,
  initialPublished = false,
  initialSettings = {},
  crmEnabled,
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
  const [isPublishing, setIsPublishing] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<SectionId | null>(
    null,
  );
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("sections");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [insertTarget, setInsertTarget] = useState<InsertTarget | null>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);

  const pageState = useMemo(
    () => ({ content, published }),
    [content, published],
  );

  const persist = useCallback(
    (data: { content: TemplateConfig; published: boolean }) =>
      updatePageContent(siteId, data.content, data.published, pageSlug),
    [siteId, pageSlug],
  );

  const {
    status: saveStatus,
    lastSavedAt,
    isDirty,
    saveNow,
    markSaved,
  } = useAutosave({ data: pageState, onSave: persist });

  useEffect(() => {
    if (!isDirty && saveStatus !== "saving") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty, saveStatus]);

  const liveUrl = useMemo(() => {
    const host = siteCustomDomain || `${siteSubdomain}.${ROOT_DOMAIN}`;
    return `https://${host}${pageSlug === "home" ? "" : `/${pageSlug}`}`;
  }, [siteCustomDomain, siteSubdomain, pageSlug]);

  const scrollToSection = useCallback((id: SectionId) => {
    const container = previewScrollRef.current;
    if (!container) return;
    const target = container.querySelector<HTMLElement>(
      `[data-section-id="${CSS.escape(id)}"]`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const selectFromSidebar = (id: SectionId) => {
    setActiveSectionId(id);
    requestAnimationFrame(() => scrollToSection(id));
  };

  const structural = useCallback(
    (updater: Parameters<typeof setContent>[0]) =>
      setContent(updater, { coalesce: false }),
    [setContent],
  );

  const handleRemoveSection = useCallback(
    (sectionId: SectionId) => {
      const index = content.sections.findIndex((s) => s.id === sectionId);
      if (index === -1) return;
      const removed = content.sections[index];
      structural(removeSection(sectionId));
      setActiveSectionId((current) => (current === sectionId ? null : current));
      showToast(`${SECTION_TYPE_LABELS[removed.type]} poistettu`, "info", {
        action: {
          label: "Kumoa",
          onClick: () => {
            structural(insertSectionAt(removed, index));
            setActiveSectionId(removed.id);
          },
        },
      });
    },
    [content.sections, structural, showToast],
  );

  const handleTogglePublished = async () => {
    const next = !published;
    if (next) {
      const confirmed = await showConfirm(
        `Julkaistaanko sivu? Se näkyy heti osoitteessa ${liveUrl}`,
        () => {},
      );
      if (!confirmed) return;
    }
    setIsPublishing(true);
    try {
      const result = await persist({ content, published: next });
      if (result?.error) {
        showToast(result.error, "error");
        return;
      }
      setPublished(next);
      markSaved({ content, published: next });
      showToast(next ? "Sivu julkaistu" : "Sivu piilotettu", "success");
    } catch {
      showToast("Julkaisu epäonnistui. Yritä uudelleen.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  const dialogOpen = isSettingsOpen || isHelpOpen || insertTarget !== null;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const shortcut = resolveShortcut(e, isTypingTarget(e.target));
      if (!shortcut) return;
      if (dialogOpen && shortcut !== "deselect") return;

      switch (shortcut) {
        case "undo":
          e.preventDefault();
          undo();
          return;
        case "redo":
          e.preventDefault();
          redo();
          return;
        case "save":
          e.preventDefault();
          void saveNow();
          return;
        case "help":
          e.preventDefault();
          setIsHelpOpen(true);
          return;
        case "deselect":
          if (dialogOpen) return;
          setActiveSectionId(null);
          return;
      }

      if (!activeSectionId) return;
      e.preventDefault();
      switch (shortcut) {
        case "remove":
          handleRemoveSection(activeSectionId);
          return;
        case "duplicate":
          structural(duplicateSection(activeSectionId));
          return;
        case "moveUp":
          structural(moveSection(activeSectionId, "up"));
          return;
        case "moveDown":
          structural(moveSection(activeSectionId, "down"));
          return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    activeSectionId,
    dialogOpen,
    undo,
    redo,
    saveNow,
    structural,
    handleRemoveSection,
  ]);

  const handleTemplateChange = async (newTemplateId: string) => {
    if (newTemplateId === content.templateId) return;

    const confirmed = await showConfirm(
      "Olet vaihtamassa templatea. Tämä voi muuttaa sivun rakennetta ja poistaa osan datasta. Haluatko jatkaa?",
      () => {},
    );

    if (confirmed) {
      const mergedContent = mergeTemplateContent(content, newTemplateId);
      if (mergedContent) {
        structural(mergedContent);
        setActiveSectionId(null);
        showToast("Template vaihdettu", "success");
      }
    }
  };

  const handleSectionUpdate = (newContent: Section["content"]) => {
    if (activeSectionId) {
      setContent(updateSectionContent(activeSectionId, newContent));
    }
  };

  const handlePickSection = (type: SectionType) => {
    if (!insertTarget) return;
    structural(addSection(type, insertTarget.afterId ?? undefined));
    setInsertTarget(null);
  };

  const handleInlineFieldUpdate = (
    sectionId: SectionId,
    field: string,
    value: string,
  ) => {
    const section = content.sections.find((s) => s.id === sectionId);
    if (!section) return;
    const nextContent = {
      ...(section.content as Record<string, unknown>),
      [field]: value,
    } as Section["content"];
    setContent(updateSectionContent(sectionId, nextContent));
  };

  const activeSection = content.sections.find((s) => s.id === activeSectionId);
  const showSidebar = !isFullPreview && isSidebarOpen;

  return (
    <EditorSiteProvider siteId={siteId}>
      <SitePagesProvider siteId={siteId}>
        <div className="flex h-screen flex-col bg-background">
          <EditorTopBar
            siteId={siteId}
            pageSlug={pageSlug}
            pageTitle={pageTitle}
            liveUrl={liveUrl}
            published={published}
            isPublishing={isPublishing}
            onTogglePublished={handleTogglePublished}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            isDirty={isDirty}
            previewMode={previewMode}
            onPreviewModeChange={setPreviewMode}
            isFullPreview={isFullPreview}
            onToggleFullPreview={() => setIsFullPreview((v) => !v)}
            isSidebarOpen={isSidebarOpen}
            onToggleSidebar={() => setIsSidebarOpen((v) => !v)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenHelp={() => setIsHelpOpen(true)}
          />

          <div className="flex min-h-0 flex-1">
            {showSidebar && (
              <aside className="flex w-[340px] shrink-0 flex-col border-r border-border bg-card">
                <div
                  role="tablist"
                  aria-label="Sivun asetukset"
                  className="flex shrink-0 border-b border-border px-2"
                >
                  {SIDEBAR_TABS.map((tab) => {
                    const active = sidebarTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setSidebarTab(tab.id)}
                        className={`-mb-px border-b-2 px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                          active
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <div role="tabpanel" className="flex-1 overflow-y-auto p-4">
                  {sidebarTab === "sections" && (
                    <SectionsPanel
                      sections={content.sections}
                      activeSectionId={activeSectionId}
                      onSelect={selectFromSidebar}
                      onToggleVisibility={(id) =>
                        structural(toggleSectionVisibility(id))
                      }
                      onRemove={handleRemoveSection}
                      onDuplicate={(id) => structural(duplicateSection(id))}
                      onReorder={(draggedId, targetId) =>
                        structural(reorderSections(draggedId, targetId))
                      }
                      onAdd={(type) =>
                        structural(
                          addSection(type, activeSectionId || undefined),
                        )
                      }
                    />
                  )}

                  {sidebarTab === "design" && (
                    <div className="space-y-4">
                      <StyleFields
                        radius={content.theme?.radius}
                        onPreset={(preset) =>
                          setContent(applyThemePreset(preset))
                        }
                        onRadiusUpdate={(radius) =>
                          setContent(updateThemeRadius(radius))
                        }
                      />
                      <ThemeFields
                        primaryColor={content.theme?.primaryColor}
                        headingFont={content.theme?.headingFont}
                        bodyFont={content.theme?.bodyFont}
                        appearance={content.theme?.appearance}
                        onColorUpdate={(value) =>
                          setContent(updateThemeColor(value))
                        }
                        onFontUpdate={(field, fontName) =>
                          setContent(updateThemeFont(field, fontName))
                        }
                        onAppearanceUpdate={(appearance) =>
                          setContent(updateThemeAppearance(appearance))
                        }
                      />
                      <TemplateSelector
                        currentTemplateId={content.templateId || "saas-modern"}
                        onTemplateChange={handleTemplateChange}
                      />
                    </div>
                  )}

                  {sidebarTab === "seo" && (
                    <SeoFields
                      metaTitle={content.seo?.metaTitle}
                      metaDescription={content.seo?.metaDescription}
                      ogImage={content.seo?.ogImage}
                      onUpdate={(field, value) =>
                        setContent(updateSeoField(field, value))
                      }
                    />
                  )}
                </div>
              </aside>
            )}

            <div className="relative min-w-0 flex-1 overflow-hidden">
              <div
                ref={previewScrollRef}
                className="h-full w-full overflow-y-auto"
                onClick={() => setActiveSectionId(null)}
              >
                {content.sections.length === 0 ? (
                  <div className="flex h-full items-center justify-center bg-muted p-8">
                    <div className="max-w-sm rounded-xl border border-dashed border-border bg-card p-8 text-center">
                      <h2 className="text-lg font-semibold text-foreground">
                        Sivu on tyhjä
                      </h2>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Lisää ensimmäinen osio, niin näet sen heti tässä.
                      </p>
                      <Button
                        className="mt-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          setInsertTarget({ afterId: null });
                        }}
                      >
                        Lisää osio
                      </Button>
                    </div>
                  </div>
                ) : (
                  <EditorPreview
                    content={content}
                    siteId={siteId}
                    previewMode={previewMode}
                    editable={!isFullPreview}
                    activeSectionId={activeSectionId}
                    onSelectSection={setActiveSectionId}
                    onMoveSection={(id, dir) =>
                      structural(moveSection(id, dir))
                    }
                    onDuplicateSection={(id) =>
                      structural(duplicateSection(id))
                    }
                    onRemoveSection={handleRemoveSection}
                    onRequestInsert={(afterId) => setInsertTarget({ afterId })}
                    onReorderSections={(draggedId, targetId) =>
                      structural(reorderSections(draggedId, targetId))
                    }
                    onUpdateSectionField={handleInlineFieldUpdate}
                  />
                )}
              </div>

              {!isFullPreview && activeSection && (
                <FloatingSectionEditor
                  section={activeSection}
                  onUpdateContent={handleSectionUpdate}
                  onUpdateStyle={(patch) =>
                    setContent(updateSectionStyle(activeSection.id, patch))
                  }
                  onClose={() => setActiveSectionId(null)}
                  crmEnabled={crmEnabled}
                />
              )}
            </div>
          </div>

          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            siteId={siteId}
            subdomain={siteSubdomain}
            rootDomain={ROOT_DOMAIN}
            customDomain={siteCustomDomain}
            initialSettings={initialSettings}
          />

          <SectionPicker
            open={insertTarget !== null}
            onClose={() => setInsertTarget(null)}
            onPick={handlePickSection}
          />

          <ShortcutHelpDialog
            open={isHelpOpen}
            onClose={() => setIsHelpOpen(false)}
          />
        </div>
      </SitePagesProvider>
    </EditorSiteProvider>
  );
}
