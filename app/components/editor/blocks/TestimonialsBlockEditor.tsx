"use client";

import type { TestimonialItem, ImageDisplay } from "@/src/lib/templates";
import SortableFieldList from "../fields/SortableFieldList";
import ImageUploadField from "../fields/ImageUploadField";
import ImageDisplayControls from "../fields/ImageDisplayControls";

type TestimonialsBlockEditorProps = {
  content: TestimonialItem[];
  onUpdate: (content: TestimonialItem[]) => void;
};

const TESTIMONIAL_FIELDS = [
  { key: "avatar", label: "Profiilikuva" },
  { key: "text", label: "Teksti" },
  { key: "name", label: "Nimi" },
  { key: "company", label: "Yritys" },
];

const DEFAULT_TESTIMONIAL_ORDER = ["avatar", "text", "name", "company"];

export default function TestimonialsBlockEditor({
  content,
  onUpdate,
}: TestimonialsBlockEditorProps) {
  const testimonials = content || [];

  const handleAdd = () => {
    onUpdate([
      ...testimonials,
      { name: "Nimi", text: "Suosittelu", company: "Yritys" },
    ]);
  };

  const handleRemove = (index: number) => {
    onUpdate(testimonials.filter((_, i) => i !== index));
  };

  const handleFieldUpdate = (
    index: number,
    field: keyof TestimonialItem,
    value: string,
  ) => {
    onUpdate(
      testimonials.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const handleFieldOrderChange = (index: number, newOrder: string[]) => {
    onUpdate(
      testimonials.map((item, i) =>
        i === index ? { ...item, fieldOrder: newOrder } : item,
      ),
    );
  };

  // Avatar presentation is shared across all testimonials, so apply the patch
  // to every item (their content is stored per-item, not block-level).
  const sharedImageDisplay = testimonials.find(
    (t) => t.imageDisplay,
  )?.imageDisplay;
  const applyImageDisplay = (patch: Partial<ImageDisplay>) => {
    const next = { ...sharedImageDisplay, ...patch };
    onUpdate(testimonials.map((item) => ({ ...item, imageDisplay: next })));
  };

  const renderField = (
    index: number,
    testimonial: TestimonialItem,
    fieldKey: string,
  ) => {
    switch (fieldKey) {
      case "name":
        return (
          <input
            type="text"
            value={testimonial.name || ""}
            onChange={(e) => handleFieldUpdate(index, "name", e.target.value)}
            className="block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
          />
        );
      case "text":
        return (
          <textarea
            value={testimonial.text || ""}
            onChange={(e) => handleFieldUpdate(index, "text", e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
          />
        );
      case "company":
        return (
          <input
            type="text"
            value={testimonial.company || ""}
            onChange={(e) =>
              handleFieldUpdate(index, "company", e.target.value)
            }
            className="block w-full rounded-md border border-input px-2 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
          />
        );
      case "avatar":
        return (
          <ImageUploadField
            value={testimonial.avatar}
            shape="round"
            onChange={(url) => handleFieldUpdate(index, "avatar", url)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Suosittelut</span>
        <button
          onClick={handleAdd}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Lisää
        </button>
      </div>
      {testimonials.some((t) => t.avatar) && (
        <div>
          <label className="mb-1 block text-sm font-medium text-foreground">
            Profiilikuvien koko & pyöristys
          </label>
          <ImageDisplayControls
            variant="card"
            value={sharedImageDisplay}
            onChange={applyImageDisplay}
          />
        </div>
      )}
      <div className="space-y-4">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="rounded-md border border-border bg-muted p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Suosittelu {index + 1}
              </span>
              <button
                onClick={() => handleRemove(index)}
                className="text-sm text-destructive hover:text-destructive"
              >
                Poista
              </button>
            </div>
            <SortableFieldList
              fields={TESTIMONIAL_FIELDS}
              fieldOrder={testimonial.fieldOrder || DEFAULT_TESTIMONIAL_ORDER}
              onReorder={(newOrder) => handleFieldOrderChange(index, newOrder)}
              renderField={(fieldKey) =>
                renderField(index, testimonial, fieldKey)
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
