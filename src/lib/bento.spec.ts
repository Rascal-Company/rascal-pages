import { describe, expect, test } from "vitest";
import { nextFreeY } from "./bento";
import type { BentoItem } from "./templates";

function makeItem(y: number, h: number): BentoItem {
  return { id: `i-${y}-${h}`, type: "text", x: 0, y, w: 6, h };
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
