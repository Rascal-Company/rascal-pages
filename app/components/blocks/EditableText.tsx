"use client";

import type {
  ClipboardEvent,
  CSSProperties,
  ElementType,
  FocusEvent,
  KeyboardEvent,
} from "react";
import { useSectionEdit } from "./SectionEditContext";

type EditableTextProps = {
  /** Key of the top-level string field on this section's content. */
  field: string;
  value: string;
  as?: ElementType;
  className?: string;
  style?: CSSProperties;
  /** Allow line breaks. Single-line fields commit on Enter instead. */
  multiline?: boolean;
};

function insertPlainText(text: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  const node = document.createTextNode(text);
  range.insertNode(node);
  range.setStartAfter(node);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

/**
 * Renders a section text field. In editable mode (inside the editor preview)
 * it becomes a contentEditable element that syncs back to the section content
 * on blur; otherwise it renders as plain text for the published site.
 *
 * Enter commits single-line fields, Escape restores the saved value, and
 * pasted content is inserted as plain text so rich formatting from another
 * page never leaks into the section.
 */
export default function EditableText({
  field,
  value,
  as: Tag = "span",
  className,
  style,
  multiline = false,
}: EditableTextProps) {
  const { editable, updateField } = useSectionEdit();

  if (!editable) {
    return (
      <Tag className={className} style={style}>
        {value}
      </Tag>
    );
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter" && !multiline && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      e.currentTarget.textContent = value;
      e.currentTarget.blur();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    insertPlainText(multiline ? text : text.replace(/\s*\n+\s*/g, " "));
  };

  return (
    <Tag
      className={`${className ?? ""} cursor-text rounded outline-none ring-primary/60 transition-shadow focus:ring-2`}
      style={style}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      role="textbox"
      aria-multiline={multiline}
      onKeyDown={handleKeyDown}
      onPaste={handlePaste}
      onBlur={(e: FocusEvent<HTMLElement>) => {
        const text = e.currentTarget.textContent ?? "";
        if (text !== value) updateField(field, text);
      }}
    >
      {value}
    </Tag>
  );
}
