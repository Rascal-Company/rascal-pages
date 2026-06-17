"use client";

import { TemplateConfig } from "@/src/lib/templates";

interface FeaturesEditorProps {
  features: TemplateConfig["features"] | undefined;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
}

export default function FeaturesEditor({
  features,
  onAdd,
  onRemove,
  onUpdate,
}: FeaturesEditorProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Ominaisuudet</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Lisää
        </button>
      </div>
      <div className="space-y-4">
        {(features || []).map((feature, index) => (
          <div
            key={index}
            className="rounded-md border border-border bg-muted p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Ominaisuus {index + 1}
              </span>
              <button
                onClick={() => onRemove(index)}
                className="text-sm text-destructive hover:text-destructive"
              >
                Poista
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Ikoni (emoji)
                </label>
                <input
                  type="text"
                  value={feature.icon || ""}
                  onChange={(e) => onUpdate(index, "icon", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                  placeholder="⭐"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Otsikko
                </label>
                <input
                  type="text"
                  value={feature.title || ""}
                  onChange={(e) => onUpdate(index, "title", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Kuvaus
                </label>
                <textarea
                  value={feature.description || ""}
                  onChange={(e) =>
                    onUpdate(index, "description", e.target.value)
                  }
                  rows={2}
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Kuvan URL (valinnainen, korvaa emojin)
                </label>
                <input
                  type="url"
                  value={feature.image || ""}
                  onChange={(e) => onUpdate(index, "image", e.target.value)}
                  placeholder="https://example.com/kuva.jpg"
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
                {feature.image && (
                  <img
                    src={feature.image}
                    alt={feature.title}
                    className="mt-2 h-12 w-12 rounded-md object-cover"
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
