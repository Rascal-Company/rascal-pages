"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { FluidBlock } from "@/src/lib/fluid";

export type ComponentBlock = Extract<FluidBlock, { type: "component" }>;

/**
 * Komponenttilohkojen renderöijä. SiteRenderer tarjoaa sen, jotta vapaan
 * osion lohko voi piirtää valmiin osion ilman moduulien kehäriippuvuutta.
 */
const FluidRenderContext = createContext<((block: ComponentBlock) => ReactNode) | null>(null);

export const FluidRenderProvider = FluidRenderContext.Provider;

export function useComponentRenderer() {
  return useContext(FluidRenderContext);
}
