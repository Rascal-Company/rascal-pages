"use client";

import type { AboutContent } from "@/src/lib/templates";

type AboutBlockEditorProps = {
  content: AboutContent;
  onUpdate: (content: AboutContent) => void;
};

export default function AboutBlockEditor({
  content,
  onUpdate,
}: AboutBlockEditorProps) {
  const handleFieldUpdate = (field: keyof AboutContent, value: string) => {
    onUpdate({ ...content, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Nimi</label>
        <input
          type="text"
          value={content?.name || ""}
          onChange={(e) => handleFieldUpdate("name", e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Bio</label>
        <textarea
          value={content?.bio || ""}
          onChange={(e) => handleFieldUpdate("bio", e.target.value)}
          rows={6}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Profiilikuvan URL (valinnainen)
        </label>
        <input
          type="url"
          value={content?.image || ""}
          onChange={(e) => handleFieldUpdate("image", e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
        {content?.image && (
          <img
            src={content.image}
            alt={content.name}
            className="mt-2 h-16 w-16 rounded-full object-cover"
          />
        )}
      </div>
    </div>
  );
}
