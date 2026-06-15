"use client";

import { TemplateConfig } from "@/src/lib/templates";

interface FaqEditorProps {
  faq: TemplateConfig["faq"] | undefined;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
}

export default function FaqEditor({
  faq,
  onAdd,
  onRemove,
  onUpdate,
}: FaqEditorProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">UKK</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Lisää
        </button>
      </div>
      <div className="space-y-4">
        {(faq || []).map((item, index) => (
          <div
            key={index}
            className="rounded-md border border-border bg-muted p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Kysymys {index + 1}
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
                  Kysymys
                </label>
                <input
                  type="text"
                  value={item.question || ""}
                  onChange={(e) => onUpdate(index, "question", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Vastaus
                </label>
                <textarea
                  value={item.answer || ""}
                  onChange={(e) => onUpdate(index, "answer", e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
