"use client";

import type { CSSProperties, ElementType, FocusEvent } from "react";
import { useSectionEdit } from "./SectionEditContext";

type EditableTextProps = {
  /** Key of the top-level string field on this section's content. */
  field: string;
  value: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
};

/**
 * Renders a section text field. In editable mode (inside the editor preview)
 * it becomes a contentEditable element that syncs back to the section content
 * on blur; otherwise it renders as plain text for the published site.
 */
export default function EditableText({
  field,
  value,
  as: Tag = "span",
  className,
  style,
}: EditableTextProps) {
  const { editable, updateField } = useSectionEdit();

  if (!editable) {
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  return (
    <Tag
      className={`${className ?? ""} cursor-text rounded outline-none ring-primary/60 transition-shadow focus:ring-2`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e: FocusEvent<HTMLElement>) => {
        const text = e.currentTarget.textContent ?? "";
        if (text !== value) updateField(field, text);
      }}
    >
      {value}
    </Tag>
  );
}
