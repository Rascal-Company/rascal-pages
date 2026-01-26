"use client";

import { trackEvent } from "@/app/actions/track-event";
import type { ComponentProps } from "react";
import type { SiteId } from "@/src/lib/types";

interface Props extends ComponentProps<"a"> {
  siteId: SiteId;
  eventMetadata?: Record<string, unknown>;
}

function isExternalUrl(href: string | undefined): boolean {
  if (!href) return false;
  return href.startsWith("http://") || href.startsWith("https://");
}

export function AnalyticsLink({
  siteId,
  eventMetadata,
  onClick,
  target,
  rel,
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

  const isExternal = isExternalUrl(props.href);
  const linkTarget = target ?? (isExternal ? "_blank" : undefined);
  const linkRel = rel ?? (isExternal ? "noopener noreferrer" : undefined);

  return (
    <a {...props} target={linkTarget} rel={linkRel} onClick={handleClick} />
  );
}
