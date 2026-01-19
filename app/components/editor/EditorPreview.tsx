'use client';

import { TemplateConfig } from '@/src/lib/templates';
import SiteRenderer from '@/app/components/renderer/SiteRenderer';

interface EditorPreviewProps {
  content: TemplateConfig;
}

export default function EditorPreview({ content }: EditorPreviewProps) {
  return (
    <div className="w-3/5 overflow-y-auto bg-gray-100 p-8">
      <div className="mx-auto max-w-full">
        <div className="rounded-lg border border-gray-300 bg-white shadow-lg overflow-hidden">
          <SiteRenderer content={content} />
        </div>
      </div>
    </div>
  );
}
