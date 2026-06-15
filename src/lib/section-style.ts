/**
 * Pure helper that turns a section's optional SectionStyle into the wrapper
 * className + inline style used by the renderer. Kept separate from the
 * renderer so it is easy to unit-test and reuse.
 */

import type { CSSProperties } from "react";
import type { SectionStyle } from "./templates";

const PADDING_Y: Record<NonNullable<SectionStyle["paddingY"]>, string> = {
  none: "",
  sm: "py-6",
  md: "py-12",
  lg: "py-20",
};

const ALIGN: Record<NonNullable<SectionStyle["align"]>, string> = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

export type SectionContainer = {
  className: string;
  style?: CSSProperties;
};

export function buildSectionContainer(style?: SectionStyle): SectionContainer {
  if (!style) return { className: "" };

  const classes = [
    style.paddingY ? PADDING_Y[style.paddingY] : "",
    style.align ? ALIGN[style.align] : "",
    style.width === "narrow" ? "mx-auto max-w-3xl" : "",
  ].filter(Boolean);

  return {
    className: classes.join(" "),
    style: style.background ? { backgroundColor: style.background } : undefined,
  };
}
