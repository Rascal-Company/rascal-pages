"use client";

import { ImageOff } from "lucide-react";

/**
 * Thumbnail preview of a published site, rendered as a scaled, non-interactive
 * iframe of the live URL. Unpublished sites fall back to a neutral placeholder
 * (the live URL would 404 / show nothing meaningful before publishing).
 */

interface SitePreviewProps {
  url: string;
  published: boolean;
  title: string;
}

export default function SitePreview({
  url,
  published,
  title,
}: SitePreviewProps) {
  if (!published) {
    return (
      <div className="flex h-44 w-full flex-col items-center justify-center gap-2 bg-muted">
        <ImageOff className="size-6 text-muted-foreground/60" aria-hidden />
        <p className="text-xs text-muted-foreground">Esikatselu näkyy julkaisun jälkeen</p>
      </div>
    );
  }

  return (
    <div className="relative h-44 w-full overflow-hidden bg-white">
      <iframe
        src={url}
        title={`Esikatselu: ${title}`}
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        scrolling="no"
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        style={{ width: "1000px", height: "700px", transform: "scale(0.42)" }}
      />
    </div>
  );
}
