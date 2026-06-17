import { describe, expect, test } from "vitest";
import type { ImageDisplay } from "./templates";
import {
  DEFAULT_IMAGE_POSITION,
  imageBoxClassName,
  imagePosition,
  isBoxMode,
} from "./image-display";

describe("isBoxMode", () => {
  test("is true only when mode is box", () => {
    expect(isBoxMode({ mode: "box" })).toBe(true);
  });

  test("is false for background mode and for unset display", () => {
    expect([isBoxMode({ mode: "background" }), isBoxMode(undefined)]).toEqual([
      false,
      false,
    ]);
  });
});

describe("imagePosition", () => {
  test("returns the configured position", () => {
    expect(imagePosition({ position: "left" })).toBe("left");
  });

  test("falls back to the default when unset", () => {
    expect(imagePosition(undefined)).toBe(DEFAULT_IMAGE_POSITION);
  });
});

describe("imageBoxClassName", () => {
  test("applies size, rounding and object-cover for an explicit config", () => {
    const display: ImageDisplay = { size: "lg", rounding: "rounded" };
    expect(imageBoxClassName(display)).toBe(
      "w-full max-w-lg rounded-2xl object-cover",
    );
  });

  test("uses md + rounded defaults when size/rounding are unset", () => {
    expect(imageBoxClassName({})).toBe(
      "w-full max-w-sm rounded-2xl object-cover",
    );
  });

  test("circle rounding forces a square aspect ratio", () => {
    const display: ImageDisplay = { size: "sm", rounding: "circle" };
    expect(imageBoxClassName(display)).toBe(
      "w-full max-w-[16rem] rounded-full object-cover aspect-square",
    );
  });

  test("none rounding yields square corners", () => {
    expect(imageBoxClassName({ size: "md", rounding: "none" })).toBe(
      "w-full max-w-sm rounded-none object-cover",
    );
  });
});
