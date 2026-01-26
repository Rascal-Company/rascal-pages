"use client";

import { trackEvent } from "@/app/actions/track-event";
import { useEffect } from "react";
import type { SiteId } from "@/src/lib/types";

interface Props {
  siteId: SiteId;
}

export function PageViewTracker({ siteId }: Props) {
  useEffect(() => {
    // Track page view on mount (fire-and-forget)
    trackEvent(siteId, "page_view", {
      url: window.location.href,
      referrer: document.referrer || undefined,
      timestamp: new Date().toISOString(),
    });
  }, [siteId]);

  return null;
}
