"use client";

import type { VideoContent } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";

type VideoBlockProps = {
  content: VideoContent;
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function VideoBlock({ content }: VideoBlockProps) {
  return (
    <section className="mx-auto max-w-5xl px-6 pb-16 lg:px-8">
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
        {content.url ? (
          <video
            src={content.url}
            controls
            className="h-full w-full object-cover"
          >
            Selaimesi ei tue video-elementtiä.
          </video>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="mt-4 text-lg font-medium text-gray-400">
                Video tulee tähän
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Aseta video-URL editorissa
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
