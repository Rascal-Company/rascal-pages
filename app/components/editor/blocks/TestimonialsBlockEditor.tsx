"use client";

import type { TestimonialItem } from "@/src/lib/templates";
import SortableFieldList from "../fields/SortableFieldList";

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
            className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
          />
        );
      case "text":
        return (
          <textarea
            value={testimonial.text || ""}
            onChange={(e) => handleFieldUpdate(index, "text", e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
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
            className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
          />
        );
      case "avatar":
        return (
          <div>
            <input
              type="url"
              value={testimonial.avatar || ""}
              onChange={(e) =>
                handleFieldUpdate(index, "avatar", e.target.value)
              }
              placeholder="https://example.com/avatar.jpg"
              className="block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
            />
            {testimonial.avatar && (
              <img
                src={testimonial.avatar}
                alt={testimonial.name}
                className="mt-2 h-10 w-10 rounded-full object-cover"
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
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">Suosittelut</span>
        <button
          onClick={handleAdd}
          className="rounded-md bg-brand-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-accent-hover"
        >
          + Lisää
        </button>
      </div>
      <div className="space-y-4">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="rounded-md border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Suosittelu {index + 1}
              </span>
              <button
                onClick={() => handleRemove(index)}
                className="text-sm text-red-600 hover:text-red-700"
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
