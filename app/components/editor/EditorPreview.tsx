"use client";

import { TemplateConfig } from "@/src/lib/templates";
import SiteRenderer from "@/app/components/renderer/SiteRenderer";
import type { SiteId } from "@/src/lib/types";

interface EditorPreviewProps {
  content: TemplateConfig;
  siteId: SiteId;
  previewMode?: "desktop" | "mobile";
}

export default function EditorPreview({
  content,
  siteId,
  previewMode = "desktop",
}: EditorPreviewProps) {
  const isMobile = previewMode === "mobile";

  return (
    <div className="h-full w-full bg-gray-100 p-8 pt-16">
      <div
        className={`mx-auto transition-all duration-300 ${
          isMobile ? "max-w-[375px]" : "max-w-full"
        }`}
      >
        <div
          className={`rounded-lg border bg-white shadow-lg overflow-hidden ${
            isMobile ? "border-gray-400 border-4" : "border-gray-300"
          }`}
        >
          {isMobile && (
            <div className="bg-gray-800 px-4 py-2 flex items-center justify-center">
              <div className="w-16 h-1 bg-gray-600 rounded-full" />
            </div>
          )}
          <SiteRenderer content={content} siteId={siteId} isPreview={true} />
          {isMobile && (
            <div className="bg-gray-800 px-4 py-3 flex items-center justify-center">
              <div className="w-10 h-10 border-2 border-gray-600 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
