"use client";

import { FONT_OPTIONS } from "@/src/lib/fonts";

type ThemeFieldsProps = {
  primaryColor?: string;
  headingFont?: string;
  bodyFont?: string;
  onColorUpdate: (value: string) => void;
  onFontUpdate: (field: "headingFont" | "bodyFont", fontName: string) => void;
};

export default function ThemeFields({
  primaryColor,
  headingFont,
  bodyFont,
  onColorUpdate,
  onFontUpdate,
}: ThemeFieldsProps) {
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
            value={primaryColor || "#E87B4E"}
            onChange={(e) => onColorUpdate(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded border border-gray-300"
          />
          <input
            type="text"
            value={primaryColor || "#E87B4E"}
            onChange={(e) => onColorUpdate(e.target.value)}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
            placeholder="#000000"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Otsikkofontti
        </label>
        <select
          value={headingFont || ""}
          onChange={(e) => onFontUpdate("headingFont", e.target.value)}
          className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
          style={headingFont ? { fontFamily: headingFont } : undefined}
        >
          <option value="">Oletus</option>
          {FONT_OPTIONS.map((font) => (
            <option key={font.id} value={font.name}>
              {font.name} ({font.category})
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">
          Leipätekstifontti
        </label>
        <select
          value={bodyFont || ""}
          onChange={(e) => onFontUpdate("bodyFont", e.target.value)}
          className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
          style={bodyFont ? { fontFamily: bodyFont } : undefined}
        >
          <option value="">Oletus</option>
          {FONT_OPTIONS.map((font) => (
            <option key={font.id} value={font.name}>
              {font.name} ({font.category})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
