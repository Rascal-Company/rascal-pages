"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { SiteId } from "@/src/lib/types";
import { listSitePages, type SitePageRef } from "@/app/actions/pages";

const SitePagesContext = createContext<SitePageRef[]>([]);

/**
 * Loads the site's pages once and provides them to the editor's link pickers,
 * so authors can point CTAs at subpages without typing slugs. Failures degrade
 * to an empty list (link fields stay usable as plain URL inputs).
 */
export function SitePagesProvider({
  siteId,
  children,
}: {
  siteId: SiteId;
  children: ReactNode;
}) {
  const [pages, setPages] = useState<SitePageRef[]>([]);

  useEffect(() => {
    let active = true;
    listSitePages(siteId)
      .then((result) => {
        if (active) setPages(result);
      })
      .catch(() => {
        if (active) setPages([]);
      });
    return () => {
      active = false;
    };
  }, [siteId]);

  return (
    <SitePagesContext.Provider value={pages}>
      {children}
    </SitePagesContext.Provider>
  );
}

/** Pages of the current site, as navigable link targets for the editor. */
export function useSitePages(): SitePageRef[] {
  return useContext(SitePagesContext);
}
