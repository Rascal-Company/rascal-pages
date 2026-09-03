"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, GripVertical, X } from "lucide-react";
import type {
  Section,
  SectionContentMap,
  SectionType,
  SectionStyle,
} from "@/src/lib/templates";
import { SECTION_TYPE_LABELS } from "@/src/lib/templates";
import BlockEditor from "./BlockEditor";
import SectionStyleInspector from "./SectionStyleInspector";
import { clampPanelPosition, type Point } from "./utils/panelPosition";

type FloatingSectionEditorProps = {
  section: Section;
  onUpdateContent: (content: SectionContentMap[SectionType]) => void;
  onUpdateStyle: (patch: Partial<SectionStyle>) => void;
  onClose: () => void;
  crmEnabled: boolean;
};

type PanelTab = "content" | "style";

const DEFAULT_POSITION: Point = { x: 16, y: 16 };

const TABS: { id: PanelTab; label: string }[] = [
  { id: "content", label: "Sisältö" },
  { id: "style", label: "Tyyli" },
];

/**
 * Floating editor that docks over the canvas for the selected section.
 * Draggable by its header, collapsible, resizable, and always kept inside the
 * canvas so it can never be dragged out of reach. Content comes first because
 * it is edited far more often than style; the chosen tab and position persist
 * while switching sections because the component stays mounted.
 */
export default function FloatingSectionEditor({
  section,
  onUpdateContent,
  onUpdateStyle,
  onClose,
  crmEnabled,
}: FloatingSectionEditorProps) {
  const [position, setPosition] = useState<Point>(DEFAULT_POSITION);
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<PanelTab>("content");
  const panelRef = useRef<HTMLDivElement>(null);
  const dragOrigin = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
  } | null>(null);

  const clampToCanvas = useCallback((next: Point): Point => {
    const panel = panelRef.current;
    const canvas = panel?.parentElement;
    if (!panel || !canvas) return next;
    return clampPanelPosition(
      next,
      { width: panel.offsetWidth, height: panel.offsetHeight },
      { width: canvas.clientWidth, height: canvas.clientHeight },
    );
  }, []);

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const origin = dragOrigin.current;
      if (!origin) return;
      setPosition(
        clampToCanvas({
          x: origin.x + e.clientX - origin.pointerX,
          y: origin.y + e.clientY - origin.pointerY,
        }),
      );
    },
    [clampToCanvas],
  );

  const handlePointerUp = useCallback(() => {
    dragOrigin.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  useEffect(() => {
    const reclamp = () => setPosition((current) => clampToCanvas(current));
    window.addEventListener("resize", reclamp);
    return () => window.removeEventListener("resize", reclamp);
  }, [clampToCanvas]);

  const startDrag = (e: React.PointerEvent) => {
    dragOrigin.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      x: position.x,
      y: position.y,
    };
  };

  const stopDragStart = (e: React.PointerEvent) => e.stopPropagation();
  const title = SECTION_TYPE_LABELS[section.type];

  return (
    <div
      ref={panelRef}
      role="dialog"
      aria-label={`Muokkaa osiota: ${title}`}
      className="absolute z-40 flex w-[360px] max-w-[calc(100%-2rem)] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl ring-1 ring-black/5"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onPointerDown={startDrag}
        className="flex cursor-grab touch-none items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 active:cursor-grabbing"
      >
        <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
          <GripVertical
            aria-hidden="true"
            className="h-4 w-4 shrink-0 text-muted-foreground"
          />
          <span className="truncate">{title}</span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onPointerDown={stopDragStart}
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Laajenna" : "Pienennä"}
            aria-expanded={!collapsed}
            title={collapsed ? "Laajenna" : "Pienennä"}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {collapsed ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronUp className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onPointerDown={stopDragStart}
            onClick={onClose}
            aria-label="Sulje muokkain"
            title="Sulje (Esc)"
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {!collapsed && (
        <>
          <div
            role="tablist"
            aria-label="Osion asetukset"
            className="flex border-b border-border px-2"
          >
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.id)}
                  className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    active
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
          <div
            role="tabpanel"
            className="resize-y overflow-y-auto overflow-x-hidden p-4"
            style={{
              height: 440,
              minHeight: 160,
              maxHeight: "calc(100vh - 9rem)",
            }}
          >
            {tab === "content" ? (
              <BlockEditor
                section={section}
                onUpdate={onUpdateContent}
                crmEnabled={crmEnabled}
              />
            ) : (
              <SectionStyleInspector
                style={section.style}
                onChange={onUpdateStyle}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
