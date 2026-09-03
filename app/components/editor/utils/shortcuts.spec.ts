import { describe, expect, test } from "vitest";
import {
  resolveShortcut,
  isTypingTarget,
  type ShortcutKeyEvent,
} from "./shortcuts";

function key(
  k: string,
  mods: Partial<Omit<ShortcutKeyEvent, "key">> = {},
): ShortcutKeyEvent {
  return {
    key: k,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    ...mods,
  };
}

describe("resolveShortcut", () => {
  test.each([
    [key("z", { metaKey: true }), "undo"],
    [key("Z", { ctrlKey: true }), "undo"],
    [key("z", { metaKey: true, shiftKey: true }), "redo"],
    [key("y", { ctrlKey: true }), "redo"],
    [key("s", { metaKey: true }), "save"],
    [key("Escape"), "deselect"],
    [key("Delete"), "remove"],
    [key("Backspace"), "remove"],
    [key("d", { metaKey: true }), "duplicate"],
    [key("ArrowUp", { altKey: true }), "moveUp"],
    [key("ArrowDown", { altKey: true }), "moveDown"],
    [key("?", { shiftKey: true }), "help"],
  ])("maps %o outside text fields", (event, expected) => {
    expect(resolveShortcut(event, false)).toBe(expected);
  });

  test("undo, redo, save and escape still resolve while typing", () => {
    expect(resolveShortcut(key("z", { metaKey: true }), true)).toBe("undo");
    expect(
      resolveShortcut(key("z", { metaKey: true, shiftKey: true }), true),
    ).toBe("redo");
    expect(resolveShortcut(key("s", { ctrlKey: true }), true)).toBe("save");
    expect(resolveShortcut(key("Escape"), true)).toBe("deselect");
  });

  test.each([
    key("Backspace"),
    key("Delete"),
    key("d", { metaKey: true }),
    key("ArrowUp", { altKey: true }),
    key("?", { shiftKey: true }),
  ])("section shortcut %o is ignored while typing", (event) => {
    expect(resolveShortcut(event, true)).toBeNull();
  });

  test("plain keys and unmodified arrows are not shortcuts", () => {
    expect(resolveShortcut(key("a"), false)).toBeNull();
    expect(resolveShortcut(key("ArrowUp"), false)).toBeNull();
    expect(resolveShortcut(key("d"), false)).toBeNull();
  });
});

describe("isTypingTarget", () => {
  test("recognises form controls and contentEditable elements", () => {
    const input = { tagName: "INPUT", isContentEditable: false };
    const editable = { tagName: "H1", isContentEditable: true };
    const div = { tagName: "DIV", isContentEditable: false };
    expect(isTypingTarget(input as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget(editable as unknown as EventTarget)).toBe(true);
    expect(isTypingTarget(div as unknown as EventTarget)).toBe(false);
  });

  test("null and non-element targets are not typing targets", () => {
    expect(isTypingTarget(null)).toBe(false);
    expect(isTypingTarget({} as EventTarget)).toBe(false);
  });
});
