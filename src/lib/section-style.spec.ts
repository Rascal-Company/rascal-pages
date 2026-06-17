import { describe, expect, test } from "vitest";
import { buildSectionContainer } from "./section-style";

describe(buildSectionContainer, () => {
  test("returns an empty container when no style is set", () => {
    expect(buildSectionContainer()).toEqual({ className: "" });
    expect(buildSectionContainer(undefined)).toEqual({ className: "" });
  });

  test("maps padding and alignment to classes", () => {
    expect(buildSectionContainer({ paddingY: "lg", align: "center" })).toEqual({
      className: "py-20 text-center",
      style: undefined,
    });
  });

  test("emits a background color as inline style", () => {
    expect(buildSectionContainer({ background: "#ff0000" })).toEqual({
      className: "",
      style: { backgroundColor: "#ff0000" },
    });
  });

  test("treats paddingY 'none' as no padding class", () => {
    expect(buildSectionContainer({ paddingY: "none" }).className).toBe("");
  });

  test("constrains width when narrow, and leaves default unconstrained", () => {
    expect(buildSectionContainer({ width: "narrow" }).className).toBe(
      "mx-auto max-w-3xl",
    );
    expect(buildSectionContainer({ width: "default" }).className).toBe("");
  });

  test("maps responsive visibility to breakpoint hidden classes", () => {
    expect(buildSectionContainer({ hideOnMobile: true }).className).toBe(
      "max-lg:hidden",
    );
    expect(buildSectionContainer({ hideOnDesktop: true }).className).toBe(
      "lg:hidden",
    );
  });
});
