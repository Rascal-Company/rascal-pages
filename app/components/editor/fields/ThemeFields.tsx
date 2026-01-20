'use client';

interface ThemeFieldsProps {
  primaryColor?: string;
  onUpdate: (value: string) => void;
}

export default function ThemeFields({ primaryColor, onUpdate }: ThemeFieldsProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Teema</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Pääväri
        </label>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="color"
            value={primaryColor || '#E87B4E'}
            onChange={(e) => onUpdate(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded border border-gray-300"
          />
          <input
            type="text"
            value={primaryColor || '#E87B4E'}
            onChange={(e) => onUpdate(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
            placeholder="#000000"
          />
        </div>
      </div>
    </div>
  );
}
