"use client";

import type { FeatureItem, ImageDisplay } from "@/src/lib/templates";
import SortableFieldList from "../fields/SortableFieldList";
import ImageUploadField from "../fields/ImageUploadField";
import ImageDisplayControls from "../fields/ImageDisplayControls";

type FeaturesBlockEditorProps = {
  content: FeatureItem[];
  onUpdate: (content: FeatureItem[]) => void;
};

const FEATURE_FIELDS = [
  { key: "icon", label: "Ikoni" },
  { key: "image", label: "Kuva" },
  { key: "title", label: "Otsikko" },
  { key: "description", label: "Kuvaus" },
];

const DEFAULT_FEATURE_ORDER = ["icon", "image", "title", "description"];

export default function FeaturesBlockEditor({
  content,
  onUpdate,
}: FeaturesBlockEditorProps) {
  const features = content || [];

  const handleAdd = () => {
    onUpdate([
      ...features,
      { icon: "⭐", title: "Uusi ominaisuus", description: "Kuvaus" },
    ]);
  };

  const handleRemove = (index: number) => {
    onUpdate(features.filter((_, i) => i !== index));
  };

  const handleFieldUpdate = (
    index: number,
    field: keyof FeatureItem,
    value: string,
  ) => {
    onUpdate(
      features.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleFieldOrderChange = (index: number, newOrder: string[]) => {
    onUpdate(
      features.map((item, i) =>
        i === index ? { ...item, fieldOrder: newOrder } : item,
      ),
    );
  };

  // Image presentation is shared across all feature cards, so apply the patch
  // to every item (their content is stored per-item, not block-level).
  const sharedImageDisplay = features.find((f) => f.imageDisplay)?.imageDisplay;
  const applyImageDisplay = (patch: Partial<ImageDisplay>) => {
    const next = { ...sharedImageDisplay, ...patch };
    onUpdate(features.map((item) => ({ ...item, imageDisplay: next })));
  };

  const renderField = (
    index: number,
    feature: FeatureItem,
    fieldKey: string,
  ) => {
    switch (fieldKey) {
      case "icon":
        return (
          <input
            type="text"
            value={feature.icon || ""}
            onChange={(e) => handleFieldUpdate(index, "icon", e.target.value)}
            className="block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
            placeholder="⭐"
          />
        );
      case "image":
        return (
          <ImageUploadField
            value={feature.image}
            onChange={(url) => handleFieldUpdate(index, "image", url)}
          />
        );
      case "title":
        return (
          <input
            type="text"
            value={feature.title || ""}
            onChange={(e) => handleFieldUpdate(index, "title", e.target.value)}
            className="block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
          />
        );
      case "description":
        return (
          <textarea
            value={feature.description || ""}
            onChange={(e) =>
              handleFieldUpdate(index, "description", e.target.value)
            }
            rows={2}
            className="block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          Ominaisuudet
        </span>
        <button
          onClick={handleAdd}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Lisää
        </button>
      </div>
      {features.some((f) => f.image) && (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Kuvien koko & pyöristys
          </label>
          <ImageDisplayControls
            variant="card"
            value={sharedImageDisplay}
            onChange={applyImageDisplay}
          />
        </div>
      )}
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="rounded-md border border-border bg-muted p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Ominaisuus {index + 1}
              </span>
              <button
                onClick={() => handleRemove(index)}
                className="text-sm text-destructive hover:text-destructive"
              >
                Poista
              </button>
            </div>
            <SortableFieldList
              fields={FEATURE_FIELDS}
              fieldOrder={feature.fieldOrder || DEFAULT_FEATURE_ORDER}
              onReorder={(newOrder) => handleFieldOrderChange(index, newOrder)}
              renderField={(fieldKey) => renderField(index, feature, fieldKey)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
