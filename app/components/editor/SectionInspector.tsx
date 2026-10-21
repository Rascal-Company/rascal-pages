"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type {
  Section,
  SectionContentMap,
  SectionType,
  SectionStyle,
} from "@/src/lib/templates";
import { SECTION_TYPE_LABELS } from "@/src/lib/templates";
import SegmentedControl from "@/app/components/ui/segmented-control";
import BlockEditor from "./BlockEditor";
import SectionStyleInspector from "./SectionStyleInspector";

type SectionInspectorProps = {
  section: Section;
  onUpdateContent: (content: SectionContentMap[SectionType]) => void;
  onUpdateStyle: (patch: Partial<SectionStyle>) => void;
  onClose: () => void;
  crmEnabled: boolean;
};

/**
 * Valitun osion tarkastin, telakoituna kankaan oikeaan reunaan (Squarespacen
 * tapaan): ei peitä sivua eikä vaadi raahaamista sivuun.
 */
export default function SectionInspector({
  section,
  onUpdateContent,
  onUpdateStyle,
  onClose,
  crmEnabled,
}: SectionInspectorProps) {
  const [tab, setTab] = useState<"content" | "style">("content");

  return (
    <aside
      className="overlay-pop flex w-[340px] shrink-0 flex-col border-l border-border bg-card"
      aria-label={`Osio: ${SECTION_TYPE_LABELS[section.type]}`}
    >
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Osio
          </p>
          <h2 className="truncate text-sm font-semibold">{SECTION_TYPE_LABELS[section.type]}</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Sulje tarkastin (Esc)"
          title="Sulje (Esc)"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
      <div className="border-b border-border p-3">
        <SegmentedControl
          ariaLabel="Tarkastimen näkymä"
          value={tab}
          onChange={setTab}
          options={[
            { value: "content", label: "Sisältö" },
            { value: "style", label: "Tyyli" },
          ]}
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-4">
        {tab === "content" ? (
          <BlockEditor section={section} onUpdate={onUpdateContent} crmEnabled={crmEnabled} />
        ) : (
          <SectionStyleInspector style={section.style} onChange={onUpdateStyle} />
        )}
      </div>
    </aside>
  );
}
