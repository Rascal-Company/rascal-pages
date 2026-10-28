"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { isSiteModalKey } from "@/src/lib/site-admin-nav";
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
import { convertPageToFluid } from "@/src/lib/fluid-convert";
import { nanoid } from "nanoid";
import {
  reorderSections,
  updateSectionContent,
  toggleSectionVisibility,
  addSection,
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
import type { SiteId, SectionId } from "@/src/lib/types";
import { useToast } from "@/app/components/ui/ToastContainer";
import EditorTopBar from "./EditorTopBar";
import EditorRail, { type PanelTab } from "./EditorRail";
import StatusMessages from "./StatusMessages";
import TemplateSelector from "./TemplateSelector";
import ThemeFields from "./fields/ThemeFields";
import StyleFields from "./fields/StyleFields";
import SeoFields from "./fields/SeoFields";
import { Button } from "@/app/components/ui/button";
import EditorPreview, { type PreviewDevice } from "./EditorPreview";
import SortableSectionItem from "./SortableSectionItem";
import SectionInspector from "./SectionInspector";
import {
  FluidEditorProvider,
  type FluidEditorApi,
  type FluidSelection,
} from "@/app/components/blocks/fluid/FluidEditorContext";
import AddSectionButton from "./AddSectionButton";
import SectionPicker from "./SectionPicker";
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
  crmEnabled: boolean;
  /** Paketin sallimat pohjat; null = kaikki (RAS-1169). */
  allowedTemplateIds?: string[] | null;
};

export default function Editor({
  siteId,
  pageId: _pageId,
  pageSlug = "home",
  pageTitle = "Etusivu",
  siteSubdomain,
  siteCustomDomain = null,
  initialContent,
  initialPublished = false,
  crmEnabled,
  allowedTemplateIds = null,
}: EditorProps) {
  const { showToast, showConfirm } = useToast();
  // Vanhat osiot muunnetaan vapaiksi osioiksi kerran, editorin avautuessa.
  const [initialPage] = useState(() =>
    convertPageToFluid(normalizeContent(initialContent), () => nanoid(10)),
  );
  const {
    state: content,
    set: setContent,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistoryState<TemplateConfig>(initialPage);
  const [published, setPublished] = useState<boolean>(initialPublished);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  // Aluksi ei valintaa: sivu näkyy kokonaan, tarkastin aukeaa osiota klikkaamalla.
  const [activeSectionId, setActiveSectionId] = useState<SectionId | null>(null);
  const [isFullPreview, setIsFullPreview] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [previewMode, setPreviewMode] = useState<PreviewDevice>("desktop");
  const [panelTab, setPanelTab] = useState<PanelTab>("sections");
  const router = useRouter();
  const searchParams = useSearchParams();

  // ?open=settings (dashboardin linkki tai päivitetty hallintaikkuna): editori
  // aukeaa ja hallintaikkuna sen päälle. Parametri poistetaan historiasta,
  // jotta ikkunan sulkeminen palaa puhtaaseen editoriin.
  useEffect(() => {
    const open = searchParams.get("open");
    if (!isSiteModalKey(open)) return;
    const rest = new URLSearchParams(searchParams.toString());
    rest.delete("open");
    const query = rest.toString();
    window.history.replaceState(null, "", `/app/dashboard/${siteId}${query ? `?${query}` : ""}`);
    router.push(`/app/dashboard/${siteId}/${open}`, { scroll: false });
    // Vain editorin avautuessa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [isPublishing, setIsPublishing] = useState(false);
  const [insertAfterId, setInsertAfterId] = useState<SectionId | null>(null);

  const [fluidSelection, setFluidSelection] = useState<FluidSelection | null>(null);
  const selectSection = (id: SectionId | null) => {
    setActiveSectionId(id);
    // Lohkon valinta säilyy, kun klikataan saman osion sisällä.
    setFluidSelection((current) => (current?.sectionId === id ? current : null));
  };

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
      updatePageContent(siteId, data.content, data.published, pageSlug),
    [siteId, pageSlug],
  );

  const {
    status: saveStatus,
    lastSavedAt,
    markSaved,
  } = useAutosave({ data: pageState, onSave: persist });

  const saveRef = useRef<() => void>(() => {});
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

  // Julkaisu tallentaa heti, jotta sivu on julkinen eikä odota automaattitallennusta.
  const handlePublishChange = async (next: boolean) => {
    setIsPublishing(true);
    setPublished(next);
    try {
      const nextState = { content, published: next };
      const result = await persist(nextState);
      if (result?.error) {
        setPublished(!next);
        showToast(result.error, "error");
      } else {
        markSaved(nextState);
        showToast(next ? "Sivu julkaistu" : "Sivu piilotettu", "success");
      }
    } catch {
      setPublished(!next);
      showToast("Julkaisu epäonnistui. Yritä uudelleen.", "error");
    } finally {
      setIsPublishing(false);
    }
  };

  // Pikanäppäimet: kumoa (⌘Z), tee uudelleen (⇧⌘Z / Ctrl+Y), tallenna (⌘S)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      // Hallintaikkunan (dialogi) näppäimet eivät koske editoria (esim. ⌘Z tekstikentässä).
      if (target?.closest?.("[role='dialog']")) return;
      const typing = target?.closest?.("input, textarea, [contenteditable]");
      if (e.key === "Escape" && !typing) {
        setActiveSectionId(null);
        setFluidSelection(null);
        return;
      }
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "s") {
        e.preventDefault();
        saveRef.current();
        return;
      }
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
      const merged = mergeTemplateContent(content, newTemplateId);
      const mergedContent = merged && convertPageToFluid(merged, () => nanoid(10));
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

  const handleRemoveSection = (sectionId: SectionId) => {
    setContent(removeSection(sectionId));
    if (activeSectionId === sectionId) {
      setActiveSectionId(content.sections[0]?.id || null);
    }
  };

  useEffect(() => {
    saveRef.current = handleSave;
  });

  const fluidEditor = useMemo<FluidEditorApi>(
    () => ({
      layout: previewMode === "mobile" ? "mobile" : "desktop",
      selection: fluidSelection,
      select: (sectionId, blockId) => {
        setActiveSectionId(sectionId);
        setFluidSelection(blockId ? { sectionId, blockIds: [blockId] } : null);
      },
      selectMany: (sectionId, blockIds) => {
        setActiveSectionId(sectionId);
        setFluidSelection(blockIds.length > 0 ? { sectionId, blockIds } : null);
      },
      commit: (sectionId, next) => setContent(updateSectionContent(sectionId, next)),
    }),
    [previewMode, fluidSelection, setContent],
  );

  const activeSection = content.sections.find((s) => s.id === activeSectionId);
  const siteUrl = siteCustomDomain
    ? `https://${siteCustomDomain}`
    : `https://${siteSubdomain}.${rootDomain}`;

  return (
    <FluidEditorProvider value={fluidEditor}>
    <EditorSiteProvider siteId={siteId}>
      <SitePagesProvider siteId={siteId}>
        <div className="flex h-dvh flex-col bg-background text-foreground">
          <EditorTopBar
            siteId={siteId}
            siteLabel={siteUrl.replace(/^https:\/\//, "")}
            siteUrl={siteUrl}
            pageSlug={pageSlug}
            pageTitle={pageTitle}
            device={previewMode}
            onDeviceChange={setPreviewMode}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            saveStatus={saveStatus}
            lastSavedAt={lastSavedAt}
            published={published}
            publishing={isPublishing || isSaving}
            onPublishChange={handlePublishChange}
            panelOpen={isSidebarOpen}
            onTogglePanel={() => setIsSidebarOpen((open) => !open)}
            fullPreview={isFullPreview}
            onToggleFullPreview={() => setIsFullPreview((full) => !full)}
          />

          <div className="flex min-h-0 flex-1">
            {!isFullPreview && (
              <EditorRail
                siteId={siteId}
                panelTab={panelTab}
                panelOpen={isSidebarOpen}
                onPanel={(tab) => {
                  if (isSidebarOpen && tab === panelTab) {
                    setIsSidebarOpen(false);
                  } else {
                    setPanelTab(tab);
                    setIsSidebarOpen(true);
                  }
                }}
              />
            )}
            {/* Paneeli */}
            {!isFullPreview && isSidebarOpen && (
              <aside className="flex w-[300px] shrink-0 flex-col border-r border-border bg-card">
                <div className="flex h-11 shrink-0 items-center border-b border-border px-4">
                  <h2 className="text-sm font-semibold">
                    {panelTab === "sections" ? "Osiot" : panelTab === "style" ? "Tyyli" : "Sivun SEO"}
                  </h2>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <StatusMessages error={error} success={success} />
                  {panelTab === "sections" && (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        Klikkaa osiota esikatselussa muokataksesi sitä. Raahaa järjestääksesi.
                      </p>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={content.sections.map((s) => s.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          <div className="space-y-1.5">
                            {content.sections.map((section) => (
                              <SortableSectionItem
                                key={section.id}
                                section={section}
                                isActive={section.id === activeSectionId}
                                onClick={() => selectSection(section.id)}
                                onToggleVisibility={() =>
                                  setContent(toggleSectionVisibility(section.id))
                                }
                                onRemove={() => handleRemoveSection(section.id)}
                                onDuplicate={() => setContent(duplicateSection(section.id))}
                              />
                            ))}
                          </div>
                        </SortableContext>
                      </DndContext>
                      <AddSectionButton onAdd={handleAddSection} />
                    </div>
                  )}
                  {panelTab === "style" && (
                    <div className="space-y-6">
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
                      <TemplateSelector
                        currentTemplateId={content.templateId || "saas-modern"}
                        onTemplateChange={handleTemplateChange}
                        allowedTemplateIds={allowedTemplateIds}
                      />
                    </div>
                  )}
                  {panelTab === "page" && (
                    <div className="space-y-6">
                      <SeoFields
                        metaTitle={content.seo?.metaTitle}
                        metaDescription={content.seo?.metaDescription}
                        ogImage={content.seo?.ogImage}
                        onUpdate={(field, value) => setContent(updateSeoField(field, value))}
                      />
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link href={`/app/dashboard/${siteId}/settings`}>
                          Sivuston asetukset (verkkotunnus, analytiikka)
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </aside>
            )}

            {/* Kangas */}
            <div className="relative min-w-0 flex-1">
              <EditorPreview
                content={content}
                siteId={siteId}
                previewMode={previewMode}
                editable={!isFullPreview}
                activeSectionId={isFullPreview ? null : activeSectionId}
                onSelectSection={selectSection}
                onMoveSection={(id, dir) => setContent(moveSection(id, dir))}
                onDuplicateSection={(id) => setContent(duplicateSection(id))}
                onRemoveSection={handleRemoveSection}
                onRequestInsert={(afterId) => setInsertAfterId(afterId)}
                onReorderSections={(draggedId, targetId) =>
                  setContent(reorderSections(draggedId, targetId))
                }
                onUpdateSectionField={handleInlineFieldUpdate}
              />
            </div>

            {/* Valitun osion tarkastin */}
            {!isFullPreview && activeSection && (
              <SectionInspector
                key={activeSection.id}
                section={activeSection}
                onUpdateContent={handleSectionUpdate}
                onUpdateStyle={(patch) =>
                  setContent(updateSectionStyle(activeSection.id, patch))
                }
                onClose={() => {
                  setActiveSectionId(null);
                  setFluidSelection(null);
                }}
                crmEnabled={crmEnabled}
              />
            )}
          </div>

          <SectionPicker
            open={insertAfterId !== null}
            onClose={() => setInsertAfterId(null)}
            onPick={handleInsertSection}
          />
        </div>
      </SitePagesProvider>
    </EditorSiteProvider>
    </FluidEditorProvider>
  );
}
