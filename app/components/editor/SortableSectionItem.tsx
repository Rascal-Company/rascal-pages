"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, Eye, EyeOff, GripVertical, Trash2 } from "lucide-react";
import type { Section } from "@/src/lib/templates";
import { SECTION_TYPE_LABELS } from "@/src/lib/templates";
import { Button } from "@/app/components/ui/button";
import { summarizeSection } from "./utils/sectionSummary";

type SortableSectionItemProps = {
  section: Section;
  isActive: boolean;
  onClick: () => void;
  onToggleVisibility: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
};

export default function SortableSectionItem({
  section,
  isActive,
  onClick,
  onToggleVisibility,
  onRemove,
  onDuplicate,
}: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const label = SECTION_TYPE_LABELS[section.type];
  const summary = summarizeSection(section);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 rounded-lg border pr-1 transition-colors ${
        isActive
          ? "border-primary bg-primary/5"
          : "border-border hover:border-input"
      } ${!section.isVisible ? "opacity-60" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded-l-lg py-3 pl-2 pr-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`Järjestä: ${label}`}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <button
        type="button"
        onClick={onClick}
        aria-current={isActive ? "true" : undefined}
        className="flex min-w-0 flex-1 flex-col items-start py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
      >
        <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
          {label}
          {!section.isVisible && (
            <EyeOff
              aria-label="Piilotettu"
              className="h-3.5 w-3.5 text-muted-foreground"
            />
          )}
        </span>
        {summary && (
          <span className="w-full truncate text-xs text-muted-foreground">
            {summary}
          </span>
        )}
      </button>

      <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisibility();
          }}
          title={section.isVisible ? "Piilota sivulta" : "Näytä sivulla"}
          aria-label={section.isVisible ? "Piilota sivulta" : "Näytä sivulla"}
        >
          {section.isVisible ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Monista"
          aria-label="Monista osio"
        >
          <Copy className="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          title="Poista"
          aria-label="Poista osio"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
