'use client';

import { TemplateConfig } from '@/src/lib/templates';

interface TestimonialsEditorProps {
  testimonials: TemplateConfig['testimonials'] | undefined;
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
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Suosittelut</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Lisää
        </button>
      </div>
      <div className="space-y-4">
        {(testimonials || []).map((testimonial, index) => (
          <div
            key={index}
            className="rounded-md border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Suosittelu {index + 1}
              </span>
              <button
                onClick={() => onRemove(index)}
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
                  value={testimonial.name || ''}
                  onChange={(e) => onUpdate(index, 'name', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Teksti
                </label>
                <textarea
                  value={testimonial.text || ''}
                  onChange={(e) => onUpdate(index, 'text', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Yritys (valinnainen)
                </label>
                <input
                  type="text"
                  value={testimonial.company || ''}
                  onChange={(e) => onUpdate(index, 'company', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
