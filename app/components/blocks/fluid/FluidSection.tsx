"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { nanoid } from "nanoid";
import {
  ArrowUpToLine,
  GripHorizontal,
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
  moveGroup,
  newBlock,
  newComponentBlock,
  isBareComponentSection,
  readingOrder,
  rectFor,
  resizeRect,
  rowCount,
  rowsForHeight,
  sectionRows,
  withMinRows,
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
import { selectedIn, useFluidEditor, type FluidEditorApi } from "./FluidEditorContext";

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
          <div key={block.id} data-rp-block={block.id}>
            <FluidBlockView block={block} bare />
          </div>
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
        <SectionSpacer content={content} blocks={blocks} autoMobile={autoMobile} />
        {blocks.map((block, index) => (
          // data-rp-block: pysyvä ankkuri overlayn elementeille (ks. overlay-pages.ts).
          <div
            key={block.id}
            data-rp-block={block.id}
            className="fluid-block"
            style={blockStyle(block, index, autoMobile)}
          >
            <FluidBlockView block={block} />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Osion asetettu vähimmäiskorkeus julkisella sivulla: tyhjä täysleveä solu
 * osion viimeisellä rivillä (asettelukohtaisesti CSS-muuttujista).
 */
function SectionSpacer({
  content,
  blocks,
  autoMobile,
}: {
  content: FluidContent;
  blocks: FluidBlock[];
  autoMobile: Map<string, FluidRect>;
}) {
  if (!content?.minRows) return null;
  const rows = (layout: FluidLayout) =>
    Math.max(1, sectionRows(content, blocks.map((b) => rectFor(b, layout, autoMobile)), layout));
  return (
    <div
      aria-hidden
      className="fluid-spacer"
      style={{
        ["--d-end" as string]: `${rows("desktop")} / span 1`,
        ["--m-end" as string]: `${rows("mobile")} / span 1`,
      }}
    />
  );
}

type Draft = {
  rects: Map<FluidBlockId, FluidRect>;
  /** Raahatun lohkon jäännössiirtymä (px), jotta lohko seuraa osoitinta 1:1. */
  residual: { x: number; y: number };
  settling: boolean;
};

type Marquee = { x: number; y: number; w: number; h: number };

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
  const [marquee, setMarquee] = useState<Marquee | null>(null);
  const [heightDraft, setHeightDraft] = useState<number | null>(null);
  const selectedIds = selectedIn(editor.selection, sectionId);
  // Kahvat ja lohkon työkalupalkki vain, kun valittuna on yksi lohko.
  const singleId = selectedIds.length === 1 ? selectedIds[0] : null;

  const rects = blocks.map((b) => rectFor(b, layout, autoMobile));
  const rows = heightDraft ?? sectionRows(content, rects, layout);
  // Ryhmän työkalupalkki ylimmän valitun lohkon päälle.
  const leadId =
    selectedIds.length > 1
      ? blocks
          .map((b, i) => ({ id: b.id, r: rects[i] }))
          .filter(({ id }) => selectedIds.includes(id))
          .sort((a, b) => a.r.y - b.r.y || a.r.x - b.r.x)[0]?.id
      : undefined;

  // Tuoreet arvot näppäin- ja osoitinkuuntelijoille.
  const stateRef = useRef({ blocks, content, layout, selectedIds, editingId });
  useEffect(() => {
    stateRef.current = { blocks, content, layout, selectedIds, editingId };
  });

  function commitBlocks(next: FluidBlock[]) {
    editor.commit(sectionId, { ...stateRef.current.content, blocks: next });
  }

  function commitRects(next: Map<FluidBlockId, FluidRect>) {
    const { blocks: current, layout: currentLayout } = stateRef.current;
    const base = currentLayout === "mobile" ? materializeMobile(current) : current;
    commitBlocks(
      base.map((b) => {
        const rect = next.get(b.id);
        return rect ? withRect(b, currentLayout, rect) : b;
      }),
    );
  }

  function currentRects(ids: FluidBlockId[]): Map<FluidBlockId, FluidRect> {
    const { blocks: current, layout: currentLayout } = stateRef.current;
    const auto = autoMobileLayout(current);
    return new Map(
      current.filter((b) => ids.includes(b.id)).map((b) => [b.id, rectFor(b, currentLayout, auto)]),
    );
  }

  function toggleSelected(id: FluidBlockId) {
    const current = stateRef.current.selectedIds;
    editor.selectMany(
      sectionId,
      current.includes(id) ? current.filter((x) => x !== id) : [...current, id],
    );
  }

  function updateBlock(id: FluidBlockId, patch: (block: FluidBlock) => FluidBlock) {
    commitBlocks(stateRef.current.blocks.map((b) => (b.id === id ? patch(b) : b)));
  }

  function removeBlocks(ids: FluidBlockId[]) {
    commitBlocks(stateRef.current.blocks.filter((b) => !ids.includes(b.id)));
    editor.select(sectionId, null);
  }

  /** Monistaa lohkot ryhmän alle samaan muodostelmaan ja valitsee kopiot. */
  function duplicateBlocks(ids: FluidBlockId[]) {
    const current = stateRef.current.blocks;
    const sources = current.filter((b) => ids.includes(b.id));
    if (sources.length === 0) return;
    const span = (list: FluidRect[]) =>
      list.length === 0
        ? 0
        : Math.max(...list.map((r) => r.y + r.h)) - Math.min(...list.map((r) => r.y)) + 1;
    const dyDesktop = span(sources.map((b) => b.desktop));
    const dyMobile = span(sources.flatMap((b) => (b.mobile ? [b.mobile] : [])));
    const copies = sources.map(
      (source) =>
        ({
          ...source,
          id: nanoid(10) as FluidBlockId,
          desktop: { ...source.desktop, y: source.desktop.y + dyDesktop },
          ...(source.mobile && { mobile: { ...source.mobile, y: source.mobile.y + dyMobile } }),
        }) as FluidBlock,
    );
    commitBlocks([...current, ...copies]);
    editor.selectMany(
      sectionId,
      copies.map((c) => c.id),
    );
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

  /** Tekstin muokkaus valmis: tallentaa tekstin ja kasvattaa lohkoa, jos teksti ei mahdu. */
  function finishText(block: Extract<FluidBlock, { type: "text" }>, text: string, heightPx: number) {
    setEditingId(null);
    const { blocks: current, layout: currentLayout } = stateRef.current;
    const rect = rectFor(block, currentLayout, autoMobileLayout(current));
    const needed = rowsForHeight(heightPx, currentLayout);
    // Automaattisessa mobiiliasettelussa korkeus johdetaan työpöydän korkeudesta.
    const grows = needed > rect.h && (currentLayout === "desktop" || Boolean(block.mobile));
    if (text === block.content.text && !grows) return;
    commitBlocks(
      current.map((b) => {
        if (b.id !== block.id || b.type !== "text") return b;
        const withText = { ...b, content: { ...b.content, text } };
        return grows ? withRect(withText, currentLayout, { ...rect, h: needed }) : withText;
      }),
    );
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
    const selected = stateRef.current.selectedIds;
    // Shift/⌘-klikkaus lisää lohkon valintaan tai poistaa sen.
    if (mode === "move" && (e.shiftKey || e.metaKey || e.ctrlKey)) {
      e.stopPropagation();
      e.preventDefault();
      toggleSelected(block.id);
      return;
    }
    // Valmiin osion sisällä voi kirjoittaa ja klikata: siirto vain kahvasta.
    if (mode === "move" && block.type === "component" && !(e.target as Element).closest("[data-drag-handle]")) {
      if (!selected.includes(block.id)) editor.select(sectionId, block.id);
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    // Valitun ryhmän lohkosta raahaaminen siirtää koko ryhmää.
    const group = mode === "move" && selected.includes(block.id) ? selected : [block.id];
    if (group.length === 1) editor.select(sectionId, block.id);

    const grid = gridRef.current;
    if (!grid) return;
    const doc = grid.ownerDocument;
    const currentLayout = stateRef.current.layout;
    const cols = columnsFor(currentLayout);
    const { gap, row } = METRICS[currentLayout];
    const colPitch = (grid.clientWidth + gap) / cols;
    const starts = currentRects(group);
    const start = starts.get(block.id) ?? rectFor(block, currentLayout, autoMobile);
    const startX = e.clientX;
    const startY = e.clientY;
    let latest = starts;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      const dxPx = ev.clientX - startX;
      const dyPx = ev.clientY - startY;
      if (!moved && Math.hypot(dxPx, dyPx) < 4) return;
      moved = true;
      const dx = Math.round(dxPx / colPitch);
      const dy = Math.round(dyPx / row);
      latest =
        mode === "move"
          ? moveGroup(starts, dx, dy, cols)
          : new Map([[block.id, resizeRect(start, handle, dx, dy, cols)]]);
      const now = latest.get(block.id) ?? start;
      const residual =
        mode === "move"
          ? { x: dxPx - (now.x - start.x) * colPitch, y: dyPx - (now.y - start.y) * row }
          : { x: 0, y: 0 };
      setDraft({ rects: latest, residual, settling: false });
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
      setDraft({ rects: latest, residual: { x: 0, y: 0 }, settling: true });
      commitRects(latest);
      setTimeout(() => setDraft(null), 180);
    };

    doc.body.style.userSelect = "none";
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
  }

  /**
   * Valintalaatikko tyhjältä alueelta: valitsee lohkot, joita laatikko koskettaa.
   * Shift/⌘ lisää nykyiseen valintaan. Pelkkä klikkaus poistaa valinnan.
   */
  function startMarquee(e: React.PointerEvent) {
    if (e.button !== 0) return;
    const grid = gridRef.current;
    if (!grid) return;
    e.preventDefault();
    const doc = grid.ownerDocument;
    const additive = e.shiftKey || e.metaKey || e.ctrlKey;
    const base = additive ? stateRef.current.selectedIds : [];
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;

    const onMove = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - startX, ev.clientY - startY) < 4) return;
      moved = true;
      const box = grid.getBoundingClientRect();
      const left = Math.min(startX, ev.clientX);
      const top = Math.min(startY, ev.clientY);
      const right = Math.max(startX, ev.clientX);
      const bottom = Math.max(startY, ev.clientY);
      setMarquee({ x: left - box.left, y: top - box.top, w: right - left, h: bottom - top });
      const hits = Array.from(grid.querySelectorAll<HTMLElement>("[data-fluid-id]"))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.left < right && r.right > left && r.top < bottom && r.bottom > top;
        })
        .map((el) => el.dataset.fluidId as FluidBlockId);
      editor.selectMany(sectionId, [...new Set([...base, ...hits])]);
    };

    const onUp = () => {
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onUp);
      doc.body.style.userSelect = "";
      setMarquee(null);
      if (!moved && !additive) editor.select(sectionId, null);
    };

    doc.body.style.userSelect = "none";
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
  }

  /** Osion alareunan kahva: vähimmäiskorkeus riveinä, ei lohkoja lyhyemmäksi. */
  function startHeightDrag(e: React.PointerEvent) {
    if (e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const grid = gridRef.current;
    if (!grid) return;
    const doc = grid.ownerDocument;
    const { content: current, layout: currentLayout, blocks: currentBlocks } = stateRef.current;
    const auto = autoMobileLayout(currentBlocks);
    const rectList = currentBlocks.map((b) => rectFor(b, currentLayout, auto));
    const minimum = Math.max(1, rowCount(rectList));
    const startRows = sectionRows(current, rectList, currentLayout);
    const { row } = METRICS[currentLayout];
    const startY = e.clientY;
    let latest = startRows;

    const onMove = (ev: PointerEvent) => {
      latest = Math.max(minimum, startRows + Math.round((ev.clientY - startY) / row));
      setHeightDraft(latest);
    };
    const onUp = () => {
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onUp);
      doc.body.style.userSelect = "";
      setHeightDraft(null);
      if (latest !== startRows) {
        editor.commit(sectionId, withMinRows(stateRef.current.content, currentLayout, latest, rectList));
      }
    };

    doc.body.style.userSelect = "none";
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
  }

  // Pikanäppäimet valituille lohkoille (iframen dokumentissa).
  const hasSelection = selectedIds.length > 0;
  useEffect(() => {
    const doc = gridRef.current?.ownerDocument;
    if (!doc || !hasSelection) return;
    const onKey = (e: KeyboardEvent) => {
      const { editingId: editing, selectedIds: selected, blocks: current, layout: currentLayout } =
        stateRef.current;
      if (selected.length === 0 || editing) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest("input, textarea, [contenteditable='true']")) return;
      const mod = e.metaKey || e.ctrlKey;

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        removeBlocks(selected);
      } else if (e.key === "Escape") {
        editor.select(sectionId, null);
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        duplicateBlocks(selected);
      } else if (mod && e.key.toLowerCase() === "a") {
        e.preventDefault();
        editor.selectMany(
          sectionId,
          current.map((b) => b.id),
        );
      } else if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        const step = e.shiftKey ? 4 : 1;
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        commitRects(moveGroup(currentRects(selected), dx, dy, columnsFor(currentLayout)));
      }
    };
    doc.addEventListener("keydown", onKey);
    return () => doc.removeEventListener("keydown", onKey);
    // Kuuntelija lukee tilan refistä; uusi kuuntelija vain, kun valinta syntyy tai poistuu.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSelection]);

  const showGuides = (draft !== null && !draft.settling) || heightDraft !== null;
  // Tyhjää tilaa raahaamista varten vain valitussa osiossa; muuten osio näyttää julkaistun korkeuden.
  const fillerRow = rows + (active || draft || heightDraft !== null ? 6 : 1);

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-16 lg:px-8">
      <div
        ref={gridRef}
        className="fluid-grid relative"
        onPointerDown={(e) => {
          const target = e.target as HTMLElement;
          if (target === e.currentTarget || target.dataset.gridEmpty !== undefined) startMarquee(e);
        }}
      >
        {/* Valintalaatikko */}
        {marquee && (
          <div
            aria-hidden
            className="pointer-events-none absolute z-[60] rounded-sm"
            style={{
              left: marquee.x,
              top: marquee.y,
              width: marquee.w,
              height: marquee.h,
              background: "rgba(232,123,78,0.08)",
              border: `1px solid ${EDITOR_ACCENT}`,
            }}
          />
        )}

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
          const draftRect = draft?.rects.get(block.id);
          const selected = selectedIds.includes(block.id);
          const single = singleId === block.id;
          const editing = editingId === block.id;
          const style = blockStyle(
            block,
            index,
            autoMobile,
            draftRect ? { layout, rect: draftRect } : undefined,
          );
          return (
            <div
              key={block.id}
              data-fluid-id={block.id}
              className={cn(
                "fluid-block group/block",
                !editing && block.type !== "component" && "cursor-grab active:cursor-grabbing",
              )}
              style={{
                ...style,
                transform:
                  draft && draftRect ? `translate(${draft.residual.x}px, ${draft.residual.y}px)` : undefined,
                transition:
                  draft && draftRect && draft.settling ? "transform 160ms cubic-bezier(.2,.8,.2,1)" : undefined,
                zIndex: draftRect ? 50 : undefined,
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
                <InlineText block={block} onDone={(text, heightPx) => finishText(block, text, heightPx)} />
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
                      single ? "opacity-100" : "opacity-0 group-hover/block:opacity-100",
                    )}
                    style={{ background: EDITOR_ACCENT }}
                  >
                    <GripVertical className="size-4" aria-hidden />
                  </span>
                </SectionEditProvider>
              ) : (
                <FluidBlockView block={block} editing />
              )}

              {leadId === block.id && (
                <div
                  className="absolute -top-11 left-0 z-50 flex items-center gap-0.5 rounded-lg bg-neutral-900 p-1 text-white shadow-lg"
                  onPointerDown={(e) => e.stopPropagation()}
                >
                  <span className="px-2 text-xs font-medium tabular-nums">{selectedIds.length} valittu</span>
                  <ToolbarButton label="Monista (⌘D)" onClick={() => duplicateBlocks(selectedIds)}>
                    <Copy />
                  </ToolbarButton>
                  <ToolbarButton label="Poista (Delete)" onClick={() => removeBlocks(selectedIds)}>
                    <Trash2 />
                  </ToolbarButton>
                </div>
              )}

              {single && !editing && (
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
                    <ToolbarButton label="Monista (⌘D)" onClick={() => duplicateBlocks([block.id])}>
                      <Copy />
                    </ToolbarButton>
                    <ToolbarButton label="Tuo eteen" onClick={() => bringToFront(block.id)}>
                      <ArrowUpToLine />
                    </ToolbarButton>
                    <ToolbarButton label="Poista (Delete)" onClick={() => removeBlocks([block.id])}>
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
        <div data-grid-empty aria-hidden style={{ gridColumn: "1 / -1", gridRow: `${fillerRow} / span 1` }} />

        {/* Osion alareuna: kahvasta säädetään osion korkeutta (tyhjää tilaa lohkojen alle). */}
        {active && rows > 0 && (
          <div
            aria-hidden
            className="pointer-events-none relative z-40 h-0 self-end"
            style={{ gridColumn: "1 / -1", gridRow: `${rows} / span 1` }}
          >
            <div
              className="absolute inset-x-0 top-0 border-t border-dashed"
              style={{ borderColor: "rgba(232,123,78,0.5)" }}
            />
            <button
              type="button"
              title="Vedä muuttaaksesi osion korkeutta"
              onPointerDown={startHeightDrag}
              onClick={(e) => e.stopPropagation()}
              className="pointer-events-auto absolute left-1/2 top-0 flex h-5 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize items-center gap-1 rounded-full px-2.5 text-[11px] font-semibold text-white shadow-md"
              style={{ background: EDITOR_ACCENT }}
            >
              <GripHorizontal className="size-3.5" aria-hidden />
              {heightDraft !== null ? `${rows} riviä` : "Osion korkeus"}
            </button>
          </div>
        )}

        {blocks.length === 0 && (
          <div className="pointer-events-none absolute inset-x-0 top-6 text-center text-sm text-foreground/50">
            Tyhjä osio — lisää lohko alta.
          </div>
        )}
      </div>

      {(active || selectedIds.length > 0 || blocks.length === 0) && (
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
  /** Teksti ja muokattavan elementin korkeus (px) lohkon kasvattamista varten. */
  onDone: (text: string, heightPx: number) => void;
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
      onBlur={(e: React.FocusEvent<HTMLElement>) =>
        onDone(e.currentTarget.innerText.replace(/\n$/, ""), e.currentTarget.getBoundingClientRect().height)
      }
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
  const selectedIds = selectedIn(editor.selection, sectionId);

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
          style={selectedIds.includes(block.id) ? { outline: `2px solid ${EDITOR_ACCENT}`, outlineOffset: -2 } : undefined}
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
