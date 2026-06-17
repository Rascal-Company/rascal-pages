"use client";

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
      <div className="flex h-48 w-full items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-xs text-muted-foreground">
            Esikatselu näkyy julkaisun jälkeen
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-48 w-full overflow-hidden bg-white">
      <iframe
        src={url}
        title={`Esikatselu: ${title}`}
        loading="lazy"
        tabIndex={-1}
        aria-hidden="true"
        scrolling="no"
        className="pointer-events-none absolute left-0 top-0 origin-top-left border-0"
        style={{ width: "1000px", height: "750px", transform: "scale(0.42)" }}
      />
    </div>
  );
}
