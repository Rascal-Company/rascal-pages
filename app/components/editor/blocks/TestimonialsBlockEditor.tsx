"use client";

import type { TestimonialItem } from "@/src/lib/templates";

type TestimonialsBlockEditorProps = {
  content: TestimonialItem[];
  onUpdate: (content: TestimonialItem[]) => void;
};

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
            <div className="mb-2 flex items-center justify-between">
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
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Nimi
                </label>
                <input
                  type="text"
                  value={testimonial.name || ""}
                  onChange={(e) =>
                    handleFieldUpdate(index, "name", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Teksti
                </label>
                <textarea
                  value={testimonial.text || ""}
                  onChange={(e) =>
                    handleFieldUpdate(index, "text", e.target.value)
                  }
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Yritys (valinnainen)
                </label>
                <input
                  type="text"
                  value={testimonial.company || ""}
                  onChange={(e) =>
                    handleFieldUpdate(index, "company", e.target.value)
                  }
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Profiilikuvan URL (valinnainen)
                </label>
                <input
                  type="url"
                  value={testimonial.avatar || ""}
                  onChange={(e) =>
                    handleFieldUpdate(index, "avatar", e.target.value)
                  }
                  placeholder="https://example.com/avatar.jpg"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
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
