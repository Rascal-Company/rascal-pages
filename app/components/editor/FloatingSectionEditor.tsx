"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  Section,
  SectionContentMap,
  SectionType,
  SectionStyle,
} from "@/src/lib/templates";
import { SECTION_TYPE_LABELS } from "@/src/lib/templates";
import BlockEditor from "./BlockEditor";
import SectionStyleInspector from "./SectionStyleInspector";

type FloatingSectionEditorProps = {
  section: Section;
  onUpdateContent: (content: SectionContentMap[SectionType]) => void;
  onUpdateStyle: (patch: Partial<SectionStyle>) => void;
  onClose: () => void;
};

const DEFAULT_POSITION = { x: 16, y: 16 };

/**
 * Squarespace-style floating editor that docks over the canvas. Replaces the
 * sidebar section tab: selecting a section on the canvas opens this panel with
 * that section's style + content controls. Draggable by its header.
 */
export default function FloatingSectionEditor({
  section,
  onUpdateContent,
  onUpdateStyle,
  onClose,
}: FloatingSectionEditorProps) {
  const [position, setPosition] = useState(DEFAULT_POSITION);
  const dragOrigin = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
  } | null>(null);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    const origin = dragOrigin.current;
    if (!origin) return;
    setPosition({
      x: Math.max(0, origin.x + e.clientX - origin.pointerX),
      y: Math.max(0, origin.y + e.clientY - origin.pointerY),
    });
  }, []);

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

  const startDrag = (e: React.PointerEvent) => {
    dragOrigin.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      x: position.x,
      y: position.y,
    };
  };

  return (
    <div
      className="absolute z-40 flex max-h-[calc(100%-2rem)] w-[340px] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      style={{ left: position.x, top: position.y }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        onPointerDown={startDrag}
        className="flex cursor-grab touch-none items-center justify-between gap-2 border-b border-border bg-muted/40 px-3 py-2 active:cursor-grabbing"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <span
            aria-hidden="true"
            className="select-none text-muted-foreground"
          >
            ⠿
          </span>
          {SECTION_TYPE_LABELS[section.type]}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Sulje muokkain"
          title="Sulje"
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <SectionStyleInspector style={section.style} onChange={onUpdateStyle} />
        <BlockEditor section={section} onUpdate={onUpdateContent} />
      </div>
    </div>
  );
}
