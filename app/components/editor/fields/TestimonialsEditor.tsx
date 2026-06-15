"use client";

import { TemplateConfig } from "@/src/lib/templates";

interface TestimonialsEditorProps {
  testimonials: TemplateConfig["testimonials"] | undefined;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
}

export default function TestimonialsEditor({
  testimonials,
  onAdd,
  onRemove,
  onUpdate,
}: TestimonialsEditorProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Suosittelut</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Lisää
        </button>
      </div>
      <div className="space-y-4">
        {(testimonials || []).map((testimonial, index) => (
          <div
            key={index}
            className="rounded-md border border-border bg-muted p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Suosittelu {index + 1}
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
                  Nimi
                </label>
                <input
                  type="text"
                  value={testimonial.name || ""}
                  onChange={(e) => onUpdate(index, "name", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Teksti
                </label>
                <textarea
                  value={testimonial.text || ""}
                  onChange={(e) => onUpdate(index, "text", e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Yritys (valinnainen)
                </label>
                <input
                  type="text"
                  value={testimonial.company || ""}
                  onChange={(e) => onUpdate(index, "company", e.target.value)}
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground">
                  Profiilikuvan URL (valinnainen)
                </label>
                <input
                  type="url"
                  value={testimonial.avatar || ""}
                  onChange={(e) => onUpdate(index, "avatar", e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="mt-1 block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                />
                {testimonial.avatar && (
                  <img
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    className="mt-2 h-10 w-10 rounded-full object-cover"
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
