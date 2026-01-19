'use client';

import { TemplateConfig } from '@/src/lib/templates';

interface FeaturesEditorProps {
  features: TemplateConfig['features'] | undefined;
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
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Ominaisuudet</h2>
        <button
          onClick={onAdd}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          + Lisää
        </button>
      </div>
      <div className="space-y-4">
        {(features || []).map((feature, index) => (
          <div
            key={index}
            className="rounded-md border border-gray-200 bg-gray-50 p-4"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Ominaisuus {index + 1}
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
                  Ikoni (emoji)
                </label>
                <input
                  type="text"
                  value={feature.icon || ''}
                  onChange={(e) => onUpdate(index, 'icon', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder="⭐"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Otsikko
                </label>
                <input
                  type="text"
                  value={feature.title || ''}
                  onChange={(e) => onUpdate(index, 'title', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600">
                  Kuvaus
                </label>
                <textarea
                  value={feature.description || ''}
                  onChange={(e) =>
                    onUpdate(index, 'description', e.target.value)
                  }
                  rows={2}
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
