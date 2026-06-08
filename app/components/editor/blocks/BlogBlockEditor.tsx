"use client";

import type { BlogContent } from "@/src/lib/templates";

type BlogBlockEditorProps = {
  content: BlogContent;
  onUpdate: (content: BlogContent) => void;
};

export default function BlogBlockEditor({
  content,
  onUpdate,
}: BlogBlockEditorProps) {
  const handleFieldUpdate = <K extends keyof BlogContent>(
    field: K,
    value: BlogContent[K],
  ) => {
    onUpdate({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        Blogiosio näyttää uusimmat julkaistut kirjoitukset. Itse kirjoitukset
        hallitaan erikseen (esim. n8n-automaation kautta).
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Otsikko
        </label>
        <input
          type="text"
          value={content?.heading || ""}
          onChange={(e) => handleFieldUpdate("heading", e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Alaotsikko
        </label>
        <input
          type="text"
          value={content?.subheading || ""}
          onChange={(e) => handleFieldUpdate("subheading", e.target.value)}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Näytettävien kirjoitusten määrä
        </label>
        <input
          type="number"
          min={1}
          max={24}
          value={content?.postsToShow ?? 6}
          onChange={(e) =>
            handleFieldUpdate(
              "postsToShow",
              Math.max(1, Number(e.target.value) || 1),
            )
          }
          className="block w-32 rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>
    </div>
  );
}
