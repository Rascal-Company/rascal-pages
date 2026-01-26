"use client";

import { trackEvent } from "@/app/actions/track-event";
import type { ComponentProps } from "react";
import type { SiteId } from "@/src/lib/types";

interface Props extends ComponentProps<"a"> {
  siteId: SiteId;
  eventMetadata?: Record<string, unknown>;
}

export function AnalyticsLink({
  siteId,
  eventMetadata,
  onClick,
  ...props
}: Props) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    // Track event (fire-and-forget)
    trackEvent(siteId, "cta_click", {
      text: typeof props.children === "string" ? props.children : undefined,
      href: props.href,
      ...eventMetadata,
    });

    // Call original onClick if provided
    onClick?.(e);
  };

  return <a {...props} onClick={handleClick} />;
}
