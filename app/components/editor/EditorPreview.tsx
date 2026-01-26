"use client";

import { TemplateConfig } from "@/src/lib/templates";
import SiteRenderer from "@/app/components/renderer/SiteRenderer";
import type { SiteId } from "@/src/lib/types";

interface EditorPreviewProps {
  content: TemplateConfig;
  siteId: SiteId;
}

export default function EditorPreview({ content, siteId }: EditorPreviewProps) {
  return (
    <div className="w-3/5 overflow-y-auto bg-gray-100 p-8">
      <div className="mx-auto max-w-full">
        <div className="rounded-lg border border-gray-300 bg-white shadow-lg overflow-hidden">
          <SiteRenderer content={content} siteId={siteId} isPreview={true} />
        </div>
      </div>
    </div>
  );
}
