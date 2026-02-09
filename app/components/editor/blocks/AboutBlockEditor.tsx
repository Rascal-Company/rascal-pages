"use client";

import type { AboutContent } from "@/src/lib/templates";
import SortableFieldList from "../fields/SortableFieldList";

type AboutBlockEditorProps = {
  content: AboutContent;
  onUpdate: (content: AboutContent) => void;
};

const ABOUT_FIELDS = [
  { key: "name", label: "Nimi" },
  { key: "bio", label: "Bio" },
  { key: "image", label: "Kuva" },
];

const DEFAULT_ABOUT_ORDER = ["name", "bio", "image"];

export default function AboutBlockEditor({
  content,
  onUpdate,
}: AboutBlockEditorProps) {
  const handleFieldUpdate = (field: keyof AboutContent, value: string) => {
    onUpdate({ ...content, [field]: value });
  };

  const handleFieldOrderChange = (newOrder: string[]) => {
    onUpdate({ ...content, fieldOrder: newOrder });
  };

  const renderField = (fieldKey: string) => {
    switch (fieldKey) {
      case "name":
        return (
          <input
            type="text"
            value={content?.name || ""}
            onChange={(e) => handleFieldUpdate("name", e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
          />
        );
      case "bio":
        return (
          <textarea
            value={content?.bio || ""}
            onChange={(e) => handleFieldUpdate("bio", e.target.value)}
            rows={6}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
          />
        );
      case "image":
        return (
          <div>
            <input
              type="url"
              value={content?.image || ""}
              onChange={(e) => handleFieldUpdate("image", e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
            />
            {content?.image && (
              <img
                src={content.image}
                alt={content.name}
                className="mt-2 h-16 w-16 rounded-full object-cover"
              />
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <SortableFieldList
        fields={ABOUT_FIELDS}
        fieldOrder={content?.fieldOrder || DEFAULT_ABOUT_ORDER}
        onReorder={handleFieldOrderChange}
        renderField={renderField}
      />
    </div>
  );
}
