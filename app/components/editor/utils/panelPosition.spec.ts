import { describe, expect, test } from "vitest";
import { clampPanelPosition } from "./panelPosition";

const panel = { width: 360, height: 480 };
const container = { width: 1280, height: 800 };

describe("clampPanelPosition", () => {
  test("leaves a position that already fits untouched", () => {
    expect(clampPanelPosition({ x: 200, y: 100 }, panel, container)).toEqual({
      x: 200,
      y: 100,
    });
  });

  test("pulls a panel dragged past the right and bottom edges back inside", () => {
    expect(clampPanelPosition({ x: 5000, y: 5000 }, panel, container)).toEqual({
      x: 1280 - 360 - 8,
      y: 800 - 480 - 8,
    });
  });

  test("never goes above the edge margin", () => {
    expect(clampPanelPosition({ x: -40, y: -40 }, panel, container)).toEqual({
      x: 8,
      y: 8,
    });
  });

  test("pins to the top-left when the panel is larger than the container", () => {
    expect(
      clampPanelPosition({ x: 300, y: 300 }, panel, {
        width: 300,
        height: 200,
      }),
    ).toEqual({ x: 8, y: 8 });
  });

  test.each([
    [
      { x: -1000, y: 0 },
      { width: 400, height: 500 },
    ],
    [
      { x: 0, y: 99999 },
      { width: 400, height: 500 },
    ],
    [
      { x: 123, y: 456 },
      { width: 4000, height: 4000 },
    ],
    [
      { x: 4000, y: 4000 },
      { width: 1024, height: 768 },
    ],
  ])(
    "position %o in container %o stays fully inside the container",
    (position, size) => {
      const result = clampPanelPosition(position, panel, size);
      expect(result.x).toBeGreaterThanOrEqual(8);
      expect(result.y).toBeGreaterThanOrEqual(8);
      expect(result.x + panel.width).toBeLessThanOrEqual(size.width);
      expect(result.y + panel.height).toBeLessThanOrEqual(size.height);
    },
  );
});
