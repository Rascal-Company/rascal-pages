"use client";

import { createContext, useContext, type ReactNode } from "react";

type SectionEditValue = {
  editable: boolean;
  updateField: (field: string, value: string) => void;
};

const SectionEditContext = createContext<SectionEditValue>({
  editable: false,
  updateField: () => {},
});

/**
 * Scopes inline-editing to a single rendered section. SiteRenderer provides one
 * per section in editable mode, binding `updateField` to that section's id.
 */
export function SectionEditProvider({
  editable,
  updateField,
  children,
}: {
  editable: boolean;
  updateField: (field: string, value: string) => void;
  children: ReactNode;
}) {
  return (
    <SectionEditContext.Provider value={{ editable, updateField }}>
      {children}
    </SectionEditContext.Provider>
  );
}

export function useSectionEdit(): SectionEditValue {
  return useContext(SectionEditContext);
}
