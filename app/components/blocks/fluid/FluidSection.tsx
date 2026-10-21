"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { nanoid } from "nanoid";
import {
  ArrowUpToLine,
  GripVertical,
  LayoutTemplate,
  Copy,
  Image as ImageIcon,
  MousePointerClick,
  Pencil,
  Plus,
  Trash2,
  Type,
  Heading,
} from "lucide-react";
import {
  autoMobileLayout,
  columnsFor,
  materializeMobile,
  moveRect,
  newBlock,
  newComponentBlock,
  isBareComponentSection,
  readingOrder,
  rectFor,
  resizeRect,
  rowCount,
  withRect,
  type FluidBlock,
  type FluidBlockId,
  type ComponentSectionType,
  type FluidContent,
  type FluidLayout,
  type FluidRect,
  type ResizeHandle,
  type TextVariant,
} from "@/src/lib/fluid";
import type { SectionId } from "@/src/lib/types";
import { cn } from "@/src/lib/utils";
import { SECTION_TYPE_LABELS } from "@/src/lib/templates";
import { getDefaultSectionContent } from "@/app/components/editor/utils/contentUtils";
import { SectionEditProvider, useSectionEdit } from "../SectionEditContext";
import FluidBlockView, { textElementProps } from "./FluidBlockView";
import { useFluidEditor, type FluidEditorApi } from "./FluidEditorContext";

/** Ruudukon mitat; pidettävä samoina kuin .fluid-grid globals.css:ssä. */
const METRICS: Record<FluidLayout, { gap: number; row: number }> = {
  desktop: { gap: 16, row: 24 },
  mobile: { gap: 12, row: 20 },
};

const EDITOR_ACCENT = "rgb(232,123,78)";

function blockStyle(
  block: FluidBlock,
  index: number,
  autoMobile: Map<string, FluidRect>,
  override?: { layout: FluidLayout; rect: FluidRect },
): CSSProperties {
  const d = override?.layout === "desktop" ? override.rect : block.desktop;
  const m = override?.layout === "mobile" ? override.rect : rectFor(block, "mobile", autoMobile);
  return {
    ["--d-c" as string]: `${d.x + 1} / span ${d.w}`,
    ["--d-r" as string]: `${d.y + 1} / span ${d.h}`,
    ["--d-h" as string]: d.h,
    ["--m-c" as string]: `${m.x + 1} / span ${m.w}`,
    ["--m-r" as string]: `${m.y + 1} / span ${m.h}`,
    ["--m-h" as string]: m.h,
    ["--z" as string]: index + 1,
  };
}

/**
 * Vapaa osio. Julkaistulla sivulla staattinen CSS Grid; editorissa lohkoja
 * voi raahata, muuttaa kokoa ja muokata suoraan.
 */
export default function FluidSection({
  sectionId,
  content,
  active = false,
}: {
  sectionId: SectionId;
  content: FluidContent;
  active?: boolean;
}) {
  const { editable } = useSectionEdit();
  const editor = useFluidEditor();
  const blocks = useMemo(() => content?.blocks ?? [], [content]);
  const autoMobile = useMemo(() => autoMobileLayout(blocks), [blocks]);

  const bare = isBareComponentSection(blocks);

  if (editable && editor && bare) {
    return (
      <EditableBareSection
        sectionId={sectionId}
        content={content}
        blocks={blocks}
        editor={editor}
        active={active}
      />
    );
  }

  if (bare) {
    return (
      <div id={content?.anchor || undefined} className="scroll-mt-24">
        {readingOrder(blocks).map((block) => (
          <FluidBlockView key={block.id} block={block} bare />
        ))}
      </div>
    );
  }

  if (editable && editor) {
    return (
      <EditableFluidSection
        sectionId={sectionId}
        content={content}
        blocks={blocks}
        autoMobile={autoMobile}
        editor={editor}
        active={active}
      />
    );
  }

  return (
    <div
      id={content?.anchor || undefined}
      className="mx-auto w-full max-w-7xl scroll-mt-24 px-6 py-16 lg:px-8"
    >
      <div className="fluid-grid">
        {blocks.map((block, index) => (
          <div key={block.id} className="fluid-block" style={blockStyle(block, index, autoMobile)}>
            <FluidBlockView block={block} />
          </div>
        ))}
      </div>
    </div>
  );
}

type Draft = {
  blockId: FluidBlockId;
  rect: FluidRect;
  residual: { x: number; y: number };
  settling: boolean;
};

const HANDLES: { handle: ResizeHandle; className: string }[] = [
  { handle: "nw", className: "-left-1.5 -top-1.5 cursor-nwse-resize" },
  { handle: "n", className: "left-1/2 -top-1.5 -translate-x-1/2 cursor-ns-resize" },
  { handle: "ne", className: "-right-1.5 -top-1.5 cursor-nesw-resize" },
  { handle: "e", className: "-right-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
  { handle: "se", className: "-bottom-1.5 -right-1.5 cursor-nwse-resize" },
  { handle: "s", className: "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize" },
  { handle: "sw", className: "-bottom-1.5 -left-1.5 cursor-nesw-resize" },
  { handle: "w", className: "-left-1.5 top-1/2 -translate-y-1/2 cursor-ew-resize" },
];

/** Valmiit osiot, jotka voi lisätä lohkoina. */
export const COMPONENT_TYPES: ComponentSectionType[] = [
  "form",
  "features",
  "faq",
  "testimonials",
  "pricing",
  "gallery",
  "video",
  "blog",
  "logos",
  "cases",
  "techStack",
  "bento",
  "about",
  "cta",
  "hero",
];

const ADD_OPTIONS: { type: "text" | "image" | "button"; label: string; icon: typeof Type; variant?: TextVariant; text?: string }[] = [
  { type: "text", label: "Otsikko", icon: Heading, variant: "h2", text: "Uusi otsikko" },
  { type: "text", label: "Teksti", icon: Type, variant: "body", text: "Kirjoita tähän" },
  { type: "image", label: "Kuva", icon: ImageIcon },
  { type: "button", label: "Painike", icon: MousePointerClick },
];

function EditableFluidSection({
  sectionId,
  content,
  blocks,
  autoMobile,
  editor,
  active,
}: {
  sectionId: SectionId;
  content: FluidContent;
  blocks: FluidBlock[];
  autoMobile: Map<string, FluidRect>;
  editor: FluidEditorApi;
  active: boolean;
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [editingId, setEditingId] = useState<FluidBlockId | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const layout = editor.layout;
  const columns = columnsFor(layout);
  const selectedId = editor.selection?.sectionId === sectionId ? editor.selection.blockId : null;

  const rects = blocks.map((b) => rectFor(b, layout, autoMobile));
  const rows = rowCount(rects);

  // Tuoreet arvot näppäin- ja osoitinkuuntelijoille.
  const stateRef = useRef({ blocks, content, layout, selectedId, editingId });
  useEffect(() => {
    stateRef.current = { blocks, content, layout, selectedId, editingId };
  });

  function commitBlocks(next: FluidBlock[]) {
    editor.commit(sectionId, { ...stateRef.current.content, blocks: next });
  }

  function commitRect(id: FluidBlockId, rect: FluidRect) {
    const { blocks: current, layout: currentLayout } = stateRef.current;
    const base = currentLayout === "mobile" ? materializeMobile(current) : current;
    commitBlocks(base.map((b) => (b.id === id ? withRect(b, currentLayout, rect) : b)));
  }

  function updateBlock(id: FluidBlockId, patch: (block: FluidBlock) => FluidBlock) {
    commitBlocks(stateRef.current.blocks.map((b) => (b.id === id ? patch(b) : b)));
  }

  function removeBlock(id: FluidBlockId) {
    commitBlocks(stateRef.current.blocks.filter((b) => b.id !== id));
    editor.select(sectionId, null);
  }

  function duplicateBlock(id: FluidBlockId) {
    const current = stateRef.current.blocks;
    const source = current.find((b) => b.id === id);
    if (!source) return;
    const copy = {
      ...source,
      id: nanoid(10) as FluidBlockId,
      desktop: { ...source.desktop, y: source.desktop.y + source.desktop.h + 1 },
      ...(source.mobile && { mobile: { ...source.mobile, y: source.mobile.y + source.mobile.h + 1 } }),
    } as FluidBlock;
    commitBlocks([...current, copy]);
    editor.select(sectionId, copy.id);
  }

  function bringToFront(id: FluidBlockId) {
    const current = stateRef.current.blocks;
    const block = current.find((b) => b.id === id);
    if (block) commitBlocks([...current.filter((b) => b.id !== id), block]);
  }

  function addBlock(option: (typeof ADD_OPTIONS)[number]) {
    const block = newBlock(option.type, nanoid(10), stateRef.current.blocks, {
      ...(option.variant && { variant: option.variant }),
      ...(option.text && { text: option.text }),
    });
    commitBlocks([...stateRef.current.blocks, block]);
    editor.select(sectionId, block.id);
    setMenuOpen(false);
  }

  function addComponent(sectionType: ComponentSectionType) {
    const block = newComponentBlock(
      sectionType,
      getDefaultSectionContent(sectionType),
      nanoid(10),
      stateRef.current.blocks,
    );
    commitBlocks([...stateRef.current.blocks, block]);
    editor.select(sectionId, block.id);
    setMenuOpen(false);
  }

  /** Raahaus ja koon muutos: lohko seuraa osoitinta 1:1 ja kohdistuu ruudukkoon. */
  function startInteraction(
    e: React.PointerEvent,
    block: FluidBlock,
    mode: "move" | "resize",
    handle: ResizeHandle = "se",
  ) {
    if (e.button !== 0) return;
    if (mode === "move" && stateRef.current.editingId === block.id) return;
    // Valmiin osion sisällä voi kirjoittaa ja klikata: siirto vain kahvasta.
    if (mode === "move" && block.type === "component" && !(e.target as Element).closest("[data-drag-handle]")) {
      editor.select(sectionId, block.id);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    editor.select(sectionId, block.id);

    const grid = gridRef.current;
    if (!grid) return;
    const doc = grid.ownerDocument;
    const currentLayout = stateRef.current.layout;
    const cols = columnsFor(currentLayout);
    const { gap, row } = METRICS[currentLayout];
    const colPitch = (grid.clientWidth + gap) / cols;
    const start = rectFor(block, currentLayout, autoMobile);
    const startX = e.clientX;
    const startY = e.clientY;
    let latest = start;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const dxPx = ev.clientX - startX;
      const dyPx = ev.clientY - startY;
      if (!moved && Math.hypot(dxPx, dyPx) < 4) return;
      moved = true;
      const dx = Math.round(dxPx / colPitch);
      const dy = Math.round(dyPx / row);
      latest = mode === "move" ? moveRect(start, dx, dy, cols) : resizeRect(start, handle, dx, dy, cols);
      const residual =
        mode === "move"
          ? { x: dxPx - (latest.x - start.x) * colPitch, y: dyPx - (latest.y - start.y) * row }
          : { x: 0, y: 0 };
      setDraft({ blockId: block.id, rect: latest, residual, settling: false });
    };

    const onUp = () => {
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onUp);
      doc.body.style.userSelect = "";
      if (!moved) {
        setDraft(null);
        return;
      }
      // Jäännössiirtymä liukuu nollaan, kun lohko asettuu ruutuunsa.
      setDraft({ blockId: block.id, rect: latest, residual: { x: 0, y: 0 }, settling: true });
      commitRect(block.id, latest);
      setTimeout(() => setDraft(null), 180);
    };

    doc.body.style.userSelect = "none";
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
  }

  // Pikanäppäimet valitulle lohkolle (iframen dokumentissa).
  useEffect(() => {
    const doc = gridRef.current?.ownerDocument;
    if (!doc || !selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      const { editingId: editing, selectedId: selected, blocks: current, layout: currentLayout } =
        stateRef.current;
      if (!selected || editing) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeBlock(selected);
      } else if (e.key === "Escape") {
        editor.select(sectionId, null);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateBlock(selected);
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 4 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const block = current.find((b) => b.id === selected);
        if (block) {
          const rect = rectFor(block, currentLayout, autoMobileLayout(current));
          commitRect(selected, moveRect(rect, dx, dy, columnsFor(currentLayout)));
        }
      }
    };
    doc.addEventListener("keydown", onKey);
    return () => doc.removeEventListener("keydown", onKey);
    // Kuuntelija lukee tilan refistä; uusi kuuntelija vain valinnan vaihtuessa.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const showGuides = draft !== null && !draft.settling;
  // Tyhjää tilaa raahaamista varten vain valitussa osiossa; muuten osio näyttää julkaistun korkeuden.
  const fillerRow = rows + (active || draft ? 6 : 1);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
      <div
        ref={gridRef}
        className="fluid-grid relative"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) editor.select(sectionId, null);
        }}
      >
        {/* Sarakeohjaimet raahauksen aikana */}
        {showGuides && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 grid"
            style={{
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              columnGap: METRICS[layout].gap,
            }}
          >
            {Array.from({ length: columns }, (_, i) => (
              <div key={i} style={{ background: "rgba(232,123,78,0.07)" }} />
            ))}
          </div>
        )}

        {blocks.map((block, index) => {
          const isDraft = draft?.blockId === block.id;
          const selected = selectedId === block.id;
          const editing = editingId === block.id;
          const style = blockStyle(
            block,
            index,
            autoMobile,
            isDraft ? { layout, rect: draft.rect } : undefined,
          );
          return (
            <div
              key={block.id}
              className={cn(
                "fluid-block group/block",
                !editing && block.type !== "component" && "cursor-grab active:cursor-grabbing",
              )}
              style={{
                ...style,
                transform: isDraft ? `translate(${draft.residual.x}px, ${draft.residual.y}px)` : undefined,
                transition: isDraft && draft.settling ? "transform 160ms cubic-bezier(.2,.8,.2,1)" : undefined,
                zIndex: isDraft ? 50 : undefined,
                outline: selected
                  ? `2px solid ${EDITOR_ACCENT}`
                  : undefined,
                outlineOffset: 2,
              }}
              onPointerDown={(e) => startInteraction(e, block, "move")}
              onClick={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.stopPropagation();
                if (block.type === "text") setEditingId(block.id);
              }}
            >
              {!selected && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute -inset-[3px] rounded-[3px] opacity-0 transition-opacity group-hover/block:opacity-100"
                  style={{ border: `1.5px dashed ${EDITOR_ACCENT}` }}
                />
              )}

              {editing && block.type === "text" ? (
                <InlineText
                  block={block}
                  onDone={(text) => {
                    setEditingId(null);
                    if (text !== block.content.text) {
                      updateBlock(block.id, (b) =>
                        b.type === "text" ? { ...b, content: { ...b.content, text } } : b,
                      );
                    }
                  }}
                />
              ) : block.type === "component" ? (
                <SectionEditProvider
                  editable
                  updateField={(field, value) =>
                    updateBlock(block.id, (b) =>
                      b.type === "component"
                        ? {
                            ...b,
                            content: {
                              ...b.content,
                              data: { ...(b.content.data as object), [field]: value } as typeof b.content.data,
                            },
                          }
                        : b,
                    )
                  }
                >
                  <FluidBlockView block={block} editing />
                  <span
                    data-drag-handle
                    title="Raahaa siirtääksesi"
                    className={cn(
                      "absolute -left-3 top-3 z-50 flex h-8 w-6 cursor-grab items-center justify-center rounded-md text-white shadow-md transition-opacity active:cursor-grabbing",
                      selected ? "opacity-100" : "opacity-0 group-hover/block:opacity-100",
                    )}
                    style={{ background: EDITOR_ACCENT }}
                  >
                    <GripVertical className="size-4" aria-hidden />
                  </span>
                </SectionEditProvider>
              ) : (
                <FluidBlockView block={block} editing />
              )}

              {selected && !editing && (
                <>
                  <div
                    className="absolute -top-11 left-0 z-50 flex items-center gap-0.5 rounded-lg bg-neutral-900 p-1 text-white shadow-lg"
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {block.type === "text" && (
                      <ToolbarButton label="Muokkaa tekstiä (tuplaklikkaus)" onClick={() => setEditingId(block.id)}>
                        <Pencil />
                      </ToolbarButton>
                    )}
                    <ToolbarButton label="Monista (⌘D)" onClick={() => duplicateBlock(block.id)}>
                      <Copy />
                    </ToolbarButton>
                    <ToolbarButton label="Tuo eteen" onClick={() => bringToFront(block.id)}>
                      <ArrowUpToLine />
                    </ToolbarButton>
                    <ToolbarButton label="Poista (Delete)" onClick={() => removeBlock(block.id)}>
                      <Trash2 />
                    </ToolbarButton>
                  </div>
                  {HANDLES.map(({ handle, className }) => (
                    <span
                      key={handle}
                      onPointerDown={(e) => startInteraction(e, block, "resize", handle)}
                      className={cn(
                        "absolute z-50 size-3 rounded-full border-2 bg-white shadow",
                        className,
                      )}
                      style={{ borderColor: EDITOR_ACCENT }}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}

        {/* Tyhjää tilaa alas, jotta lohkoja voi raahata osion loppuun */}
        <div aria-hidden style={{ gridColumn: "1 / -1", gridRow: `${fillerRow} / span 1` }} />

        {blocks.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-6 text-center text-sm text-foreground/50">
            Tyhjä osio — lisää lohko alta.
          </div>
        )}
      </div>

      {(active || selectedId || blocks.length === 0) && (
        <div className="relative mt-4 flex justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95"
            style={{ background: EDITOR_ACCENT }}
          >
            <Plus className="size-4" aria-hidden />
            Lisää lohko
          </button>
          {menuOpen && (
            <div
              className="absolute bottom-full z-50 mb-2 w-80 rounded-xl bg-neutral-900 p-1.5 text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-4 gap-1">
                {ADD_OPTIONS.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    onClick={() => addBlock(option)}
                    className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-xs font-medium hover:bg-white/10"
                  >
                    <option.icon className="size-5" aria-hidden />
                    {option.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 flex items-center gap-1.5 px-2 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-white/50">
                <LayoutTemplate className="size-3.5" aria-hidden />
                Valmiit osiot
              </p>
              <div className="grid max-h-48 grid-cols-2 gap-0.5 overflow-y-auto p-1">
                {COMPONENT_TYPES.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => addComponent(type)}
                    className="rounded-md px-2 py-1.5 text-left text-xs hover:bg-white/10"
                  >
                    {SECTION_TYPE_LABELS[type]}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="inline-flex size-8 items-center justify-center rounded-md hover:bg-white/15 [&_svg]:size-4"
    >
      {children}
    </button>
  );
}

/** Tekstilohkon muokkaus suoraan sivulla. Enter ilman Shiftiä tai Esc lopettaa. */
function InlineText({
  block,
  onDone,
}: {
  block: Extract<FluidBlock, { type: "text" }>;
  onDone: (text: string) => void;
}) {
  const ref = useRef<HTMLElement>(null);
  const { Tag, className, style } = textElementProps(block.content);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    const selection = el.ownerDocument.getSelection();
    const range = el.ownerDocument.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  }, []);

  return (
    <Tag
      ref={ref as React.Ref<HTMLHeadingElement & HTMLParagraphElement>}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      className={cn(className, "cursor-text outline-none")}
      style={style}
      onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
      onBlur={(e: React.FocusEvent<HTMLElement>) => onDone(e.currentTarget.innerText.replace(/\n$/, ""))}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        if (e.key === "Escape" || (e.key === "Enter" && !e.shiftKey && block.content.variant !== "body")) {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    >
      {block.content.text}
    </Tag>
  );
}

/**
 * Paljas komponenttiosio editorissa: valmis osio näkyy omana itsenään, sen
 * tekstejä voi muokata suoraan ja sen voi valita. Tekstin, kuvan tai painikkeen
 * lisääminen siirtää osion ruudukkotilaan.
 */
function EditableBareSection({
  sectionId,
  content,
  blocks,
  editor,
  active,
}: {
  sectionId: SectionId;
  content: FluidContent;
  blocks: FluidBlock[];
  editor: FluidEditorApi;
  active: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const selectedId = editor.selection?.sectionId === sectionId ? editor.selection.blockId : null;

  function commitBlocks(next: FluidBlock[]) {
    editor.commit(sectionId, { ...content, blocks: next });
  }

  function addBlock(option: (typeof ADD_OPTIONS)[number]) {
    const block = newBlock(option.type, nanoid(10), blocks, {
      ...(option.variant && { variant: option.variant }),
      ...(option.text && { text: option.text }),
    });
    commitBlocks([...blocks, block]);
    editor.select(sectionId, block.id);
    setMenuOpen(false);
  }

  return (
    <div id={content?.anchor || undefined} className="scroll-mt-24">
      {readingOrder(blocks).map((block) => (
        <div
          key={block.id}
          className="relative"
          style={selectedId === block.id ? { outline: `2px solid ${EDITOR_ACCENT}`, outlineOffset: -2 } : undefined}
          onClick={(e) => {
            e.stopPropagation();
            editor.select(sectionId, block.id);
          }}
        >
          <SectionEditProvider
            editable
            updateField={(field, value) =>
              commitBlocks(
                blocks.map((b) =>
                  b.id === block.id && b.type === "component"
                    ? {
                        ...b,
                        content: {
                          ...b.content,
                          data: { ...(b.content.data as object), [field]: value } as typeof b.content.data,
                        },
                      }
                    : b,
                ),
              )
            }
          >
            <FluidBlockView block={block} editing bare />
          </SectionEditProvider>
        </div>
      ))}
      {active && (
        <div className="relative flex justify-center pb-6">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg transition-transform active:scale-95"
            style={{ background: EDITOR_ACCENT }}
          >
            <Plus className="size-4" aria-hidden />
            Lisää lohko
          </button>
          {menuOpen && (
            <div
              className="absolute bottom-full z-50 mb-2 grid w-72 grid-cols-4 gap-1 rounded-xl bg-neutral-900 p-1.5 text-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {ADD_OPTIONS.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  onClick={() => addBlock(option)}
                  className="flex flex-col items-center gap-1.5 rounded-lg px-2 py-3 text-xs font-medium hover:bg-white/10"
                >
                  <option.icon className="size-5" aria-hidden />
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
