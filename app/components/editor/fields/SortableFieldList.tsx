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
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";

type FieldDefinition = {
  key: string;
  label: string;
};

type SortableFieldListProps = {
  fields: FieldDefinition[];
  fieldOrder: string[];
  onReorder: (newOrder: string[]) => void;
  renderField: (fieldKey: string) => ReactNode;
};

function SortableFieldItem({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="cursor-grab touch-none p-1 text-gray-400 hover:text-gray-600"
          aria-label={`Raahaa: ${label}`}
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
              d="M4 8h16M4 16h16"
            />
          </svg>
        </button>
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

export default function SortableFieldList({
  fields,
  fieldOrder,
  onReorder,
  renderField,
}: SortableFieldListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const orderedFields = fieldOrder
    .filter((key) => fields.some((f) => f.key === key))
    .map((key) => fields.find((f) => f.key === key)!);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = fieldOrder.indexOf(active.id as string);
    const newIndex = fieldOrder.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = [...fieldOrder];
    const [removed] = newOrder.splice(oldIndex, 1);
    newOrder.splice(newIndex, 0, removed);
    onReorder(newOrder);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={fieldOrder}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {orderedFields.map((field) => (
            <SortableFieldItem
              key={field.key}
              id={field.key}
              label={field.label}
            >
              {renderField(field.key)}
            </SortableFieldItem>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
