"use client";

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
import type { Section, SectionType } from "@/src/lib/templates";
import type { SectionId } from "@/src/lib/types";
import SortableSectionItem from "./SortableSectionItem";
import AddSectionButton from "./AddSectionButton";

type SectionsPanelProps = {
  sections: Section[];
  activeSectionId: SectionId | null;
  onSelect: (id: SectionId) => void;
  onToggleVisibility: (id: SectionId) => void;
  onRemove: (id: SectionId) => void;
  onDuplicate: (id: SectionId) => void;
  onReorder: (draggedId: SectionId, targetId: SectionId) => void;
  onAdd: (type: SectionType) => void;
};

/**
 * Sidebar list of the page's sections: reorder by drag or keyboard, select to
 * edit, and add new ones. Shows a short empty state instead of a bare list
 * when the page has no sections yet.
 */
export default function SectionsPanel({
  sections,
  activeSectionId,
  onSelect,
  onToggleVisibility,
  onRemove,
  onDuplicate,
  onReorder,
  onAdd,
}: SectionsPanelProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      onReorder(active.id as SectionId, over.id as SectionId);
    }
  };

  return (
    <div className="space-y-3">
      {sections.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          Sivulla ei ole vielä osioita. Aloita lisäämällä pääosio.
        </p>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={sections.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {sections.map((section) => (
                <SortableSectionItem
                  key={section.id}
                  section={section}
                  isActive={section.id === activeSectionId}
                  onClick={() => onSelect(section.id)}
                  onToggleVisibility={() => onToggleVisibility(section.id)}
                  onRemove={() => onRemove(section.id)}
                  onDuplicate={() => onDuplicate(section.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
      <AddSectionButton onAdd={onAdd} />
      <p className="text-xs text-muted-foreground">
        Vinkki: raahaa kahvasta tai käytä nuolinäppäimiä järjestämiseen. Paina ?
        nähdäksesi kaikki pikanäppäimet.
      </p>
    </div>
  );
}
