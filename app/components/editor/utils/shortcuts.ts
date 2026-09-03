export type EditorShortcut =
  | "undo"
  | "redo"
  | "save"
  | "deselect"
  | "remove"
  | "duplicate"
  | "moveUp"
  | "moveDown"
  | "help";

export type ShortcutKeyEvent = {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
};

/**
 * Whether keyboard focus is somewhere the user is typing, so single-key
 * shortcuts (Delete, ?) and Cmd+D must not fire. Undo/redo/save are still
 * resolved from text fields because browsers handle them poorly in
 * contentEditable and the editor owns the history.
 */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as HTMLElement).tagName !== "string") {
    return false;
  }
  const el = target as HTMLElement;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return el.isContentEditable === true;
}

/**
 * Maps a keydown to an editor command. Returns null when the key is not a
 * shortcut, or when a section-level shortcut fires while typing. Pure so the
 * mapping is unit-testable without a DOM.
 */
export function resolveShortcut(
  event: ShortcutKeyEvent,
  typing: boolean,
): EditorShortcut | null {
  const mod = event.metaKey || event.ctrlKey;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;

  if (mod && key === "z") return event.shiftKey ? "redo" : "undo";
  if (mod && key === "y") return "redo";
  if (mod && key === "s") return "save";

  if (key === "Escape") return "deselect";

  if (typing) return null;

  if (mod && key === "d") return "duplicate";
  if (key === "Delete" || key === "Backspace") return "remove";
  if (event.altKey && key === "ArrowUp") return "moveUp";
  if (event.altKey && key === "ArrowDown") return "moveDown";
  if (key === "?" || (event.shiftKey && key === "/")) return "help";

  return null;
}

export const SHORTCUT_HELP: { keys: string; label: string }[] = [
  { keys: "⌘ Z", label: "Kumoa" },
  { keys: "⌘ ⇧ Z", label: "Tee uudelleen" },
  { keys: "⌘ S", label: "Tallenna heti" },
  { keys: "Esc", label: "Poista valinta / sulje muokkain" },
  { keys: "⌫", label: "Poista valittu osio" },
  { keys: "⌘ D", label: "Monista valittu osio" },
  { keys: "⌥ ↑ / ⌥ ↓", label: "Siirrä valittua osiota" },
  { keys: "?", label: "Näytä tämä ohje" },
];
