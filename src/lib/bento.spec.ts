import { describe, expect, test } from "vitest";
import { nextFreeY, isBoxed, itemsInReadingOrder, defaultBoxed } from "./bento";
import type { BentoItem, BentoElementType } from "./templates";

function makeItem(y: number, h: number): BentoItem {
  return { id: `i-${y}-${h}`, type: "text", x: 0, y, w: 6, h };
}

function typed(type: BentoElementType, boxed?: boolean): BentoItem {
  return { id: `i-${type}`, type, x: 0, y: 0, w: 3, h: 1, boxed };
}

describe("nextFreeY", () => {
  test("returns 0 for an empty grid", () => {
    expect(nextFreeY([])).toEqual(0);
  });

  test("returns the bottom edge of the single existing item", () => {
    expect(nextFreeY([makeItem(2, 3)])).toEqual(5);
  });

  test("returns the lowest bottom edge across overlapping rows", () => {
    const items = [makeItem(0, 2), makeItem(1, 4), makeItem(3, 1)];
    expect(nextFreeY(items)).toEqual(5);
  });
});

describe(defaultBoxed, () => {
  test("stats and cards are boxed by default, plain elements are not", () => {
    expect(defaultBoxed("stat")).toBe(true);
    expect(defaultBoxed("card")).toBe(true);
    expect(defaultBoxed("heading")).toBe(false);
    expect(defaultBoxed("text")).toBe(false);
    expect(defaultBoxed("button")).toBe(false);
  });
});

describe(isBoxed, () => {
  test("images are never boxed even when boxed is set", () => {
    expect(isBoxed(typed("image", true))).toBe(false);
  });

  test("explicit boxed overrides the per-type default", () => {
    expect(isBoxed(typed("heading", true))).toBe(true);
    expect(isBoxed(typed("stat", false))).toBe(false);
  });

  test("falls back to the per-type default when unset", () => {
    expect(isBoxed(typed("stat"))).toBe(true);
    expect(isBoxed(typed("text"))).toBe(false);
  });
});

describe(itemsInReadingOrder, () => {
  test("orders top-to-bottom then left-to-right without mutating input", () => {
    const input: BentoItem[] = [
      { id: "b", type: "text", x: 6, y: 0, w: 3, h: 1 },
      { id: "c", type: "text", x: 0, y: 2, w: 3, h: 1 },
      { id: "a", type: "text", x: 0, y: 0, w: 3, h: 1 },
    ];
    expect(itemsInReadingOrder(input).map((i) => i.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(input[0].id).toBe("b");
  });
});
