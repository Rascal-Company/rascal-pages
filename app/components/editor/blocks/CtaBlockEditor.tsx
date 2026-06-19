"use client";

import type { CtaContent } from "@/src/lib/templates";

type CtaBlockEditorProps = {
  content: CtaContent;
  onUpdate: (content: CtaContent) => void;
};

const inputClass =
  "block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm";

export default function CtaBlockEditor({
  content,
  onUpdate,
}: CtaBlockEditorProps) {
  const updateField = <K extends keyof CtaContent>(
    field: K,
    value: CtaContent[K],
  ) => {
    onUpdate({ ...content, [field]: value });
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
          Teksti
        </label>
        <textarea
          value={content.text || ""}
          onChange={(e) => updateField("text", e.target.value)}
          rows={2}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Ensisijainen nappi
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={content.primaryCtaText || ""}
            onChange={(e) => updateField("primaryCtaText", e.target.value)}
            placeholder="Napin teksti"
            className={`${inputClass} w-1/3`}
          />
          <input
            type="text"
            value={content.primaryCtaLink || ""}
            onChange={(e) => updateField("primaryCtaLink", e.target.value)}
            placeholder="#tai https://..."
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Toissijainen nappi (valinnainen)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={content.secondaryCtaText || ""}
            onChange={(e) => updateField("secondaryCtaText", e.target.value)}
            placeholder="Napin teksti"
            className={`${inputClass} w-1/3`}
          />
          <input
            type="text"
            value={content.secondaryCtaLink || ""}
            onChange={(e) => updateField("secondaryCtaLink", e.target.value)}
            placeholder="#tai https://..."
            className={inputClass}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={content.filled ?? false}
          onChange={(e) => updateField("filled", e.target.checked)}
          className="rounded border-input"
        />
        Täytä pääväreillä (korostettu)
      </label>
    </div>
  );
}
