"use client";

import { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { SiteId } from "@/src/lib/types";

const EditorSiteContext = createContext<SiteId | null>(null);

export function EditorSiteProvider({
  siteId,
  children,
}: {
  siteId: SiteId;
  children: ReactNode;
}) {
  return (
    <EditorSiteContext.Provider value={siteId}>
      {children}
    </EditorSiteContext.Provider>
  );
}

/** Read the current site id; throws when used outside the editor provider. */
export function useEditorSite(): SiteId {
  const siteId = useContext(EditorSiteContext);
  if (!siteId) {
    throw new Error("useEditorSite must be used within an EditorSiteProvider");
  }
  return siteId;
}
