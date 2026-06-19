"use client";

import type { GalleryContent, GalleryImage } from "@/src/lib/templates";
import ImageUploadField from "../fields/ImageUploadField";

type GalleryBlockEditorProps = {
  content: GalleryContent;
  onUpdate: (content: GalleryContent) => void;
};

const inputClass =
  "block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm";

const emptyImage: GalleryImage = { url: "", caption: "" };

export default function GalleryBlockEditor({
  content,
  onUpdate,
}: GalleryBlockEditorProps) {
  const images = content.images || [];

  const updateField = <K extends keyof GalleryContent>(
    field: K,
    value: GalleryContent[K],
  ) => {
    onUpdate({ ...content, [field]: value });
  };

  const updateImage = (index: number, patch: Partial<GalleryImage>) => {
    updateField(
      "images",
      images.map((image, i) => (i === index ? { ...image, ...patch } : image)),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Otsikko
        </label>
        <input
          type="text"
          value={content.heading || ""}
          onChange={(e) => updateField("heading", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Alaotsikko
        </label>
        <input
          type="text"
          value={content.subheading || ""}
          onChange={(e) => updateField("subheading", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Sarakkeet
        </label>
        <div className="grid grid-cols-3 gap-1">
          {([2, 3, 4] as const).map((cols) => (
            <button
              key={cols}
              type="button"
              onClick={() => updateField("columns", cols)}
              className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                (content.columns ?? 3) === cols
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:bg-accent"
              }`}
            >
              {cols}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Kuvat</span>
        <button
          onClick={() => updateField("images", [...images, { ...emptyImage }])}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Lisää
        </button>
      </div>

      <div className="space-y-4">
        {images.map((image, index) => (
          <div
            key={index}
            className="space-y-3 rounded-md border border-border bg-muted p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Kuva {index + 1}
              </span>
              <button
                onClick={() =>
                  updateField(
                    "images",
                    images.filter((_, i) => i !== index),
                  )
                }
                className="text-sm text-destructive hover:text-destructive"
              >
                Poista
              </button>
            </div>
            <ImageUploadField
              value={image.url}
              onChange={(url) => updateImage(index, { url })}
            />
            <input
              type="text"
              value={image.caption || ""}
              onChange={(e) => updateImage(index, { caption: e.target.value })}
              placeholder="Kuvateksti (valinnainen)"
              className={inputClass}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
