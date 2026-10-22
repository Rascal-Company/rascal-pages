"use client";

import { createContext, useContext } from "react";
import type { SectionId } from "@/src/lib/types";
import type { FluidBlockId, FluidContent, FluidLayout } from "@/src/lib/fluid";

/** Valitut lohkot (yksi tai useampi) yhden osion sisällä. */
export type FluidSelection = { sectionId: SectionId; blockIds: FluidBlockId[] };

/**
 * Editorin tila vapaille osioille. Editori tarjoaa kontekstin sekä esikatselu-
 * iframelle (React-portaali välittää kontekstin) että tarkastimelle. Julkaistulla
 * sivulla kontekstia ei ole, joten osiot renderöityvät staattisina.
 */
export type FluidEditorApi = {
  /** Muokattava asettelu: mobiiliesikatselussa mobiili, muuten työpöytä. */
  layout: FluidLayout;
  selection: FluidSelection | null;
  select: (sectionId: SectionId, blockId: FluidBlockId | null) => void;
  /** Monivalinta (Shift/⌘-klikkaus, valintalaatikko); tyhjä lista poistaa valinnan. */
  selectMany: (sectionId: SectionId, blockIds: FluidBlockId[]) => void;
  /** Tallentaa osion sisällön (yksi kumoa-askel). */
  commit: (sectionId: SectionId, content: FluidContent) => void;
};

const FluidEditorContext = createContext<FluidEditorApi | null>(null);

export const FluidEditorProvider = FluidEditorContext.Provider;

export function useFluidEditor(): FluidEditorApi | null {
  return useContext(FluidEditorContext);
}

/** Osion valitut lohkot (tyhjä, jos valinta on toisessa osiossa). */
export function selectedIn(selection: FluidSelection | null, sectionId: SectionId): FluidBlockId[] {
  return selection?.sectionId === sectionId ? selection.blockIds : [];
}
