"use client";

import type { FeatureItem } from "@/src/lib/templates";
import SortableFieldList from "../fields/SortableFieldList";

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

  const renderField = (index: number, feature: FeatureItem, fieldKey: string) => {
    switch (fieldKey) {
      case "icon":
        return (
          <input
            type="text"
            value={feature.icon || ""}
            onChange={(e) => handleFieldUpdate(index, "icon", e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
            placeholder="⭐"
          />
        );
      case "image":
        return (
          <div>
            <input
              type="url"
              value={feature.image || ""}
              onChange={(e) => handleFieldUpdate(index, "image", e.target.value)}
              placeholder="https://example.com/kuva.jpg"
              className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
            />
            {feature.image && (
              <img
                src={feature.image}
                alt={feature.title}
                className="mt-2 h-12 w-12 rounded-md object-cover"
              />
            )}
          </div>
        );
      case "title":
        return (
          <input
            type="text"
            value={feature.title || ""}
            onChange={(e) => handleFieldUpdate(index, "title", e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
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
            className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Ominaisuudet</span>
        <button
          onClick={handleAdd}
          className="rounded-md bg-brand-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-accent-hover"
        >
          + Lisää
        </button>
      </div>
      <div className="space-y-4">
        {features.map((feature, index) => (
          <div
            key={index}
            className="rounded-md border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Ominaisuus {index + 1}
              </span>
              <button
                onClick={() => handleRemove(index)}
                className="text-sm text-red-600 hover:text-red-700"
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
