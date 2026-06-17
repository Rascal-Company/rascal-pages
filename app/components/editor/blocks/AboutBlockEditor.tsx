"use client";

import type { AboutContent } from "@/src/lib/templates";
import SortableFieldList from "../fields/SortableFieldList";
import ImageUploadField from "../fields/ImageUploadField";
import ImageDisplayControls from "../fields/ImageDisplayControls";

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
            className="block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
          />
        );
      case "bio":
        return (
          <textarea
            value={content?.bio || ""}
            onChange={(e) => handleFieldUpdate("bio", e.target.value)}
            rows={6}
            className="block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
          />
        );
      case "image":
        return (
          <div className="space-y-3">
            <ImageUploadField
              value={content?.image}
              shape="round"
              onChange={(url) => handleFieldUpdate("image", url)}
            />
            {content?.image && (
              <ImageDisplayControls
                value={content?.imageDisplay}
                onChange={(patch) =>
                  onUpdate({
                    ...content,
                    imageDisplay: { ...content?.imageDisplay, ...patch },
                  })
                }
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
