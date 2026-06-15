"use client";

import { THEME_PRESETS, type ThemePreset } from "@/src/lib/site-theme";

type StyleFieldsProps = {
  radius?: string;
  onPreset: (preset: ThemePreset) => void;
  onRadiusUpdate: (radius: string) => void;
};

const RADIUS_OPTIONS: { value: string; label: string }[] = [
  { value: "0rem", label: "Terävä" },
  { value: "0.375rem", label: "Pehmeä" },
  { value: "0.75rem", label: "Pyöreä" },
  { value: "1.25rem", label: "Erittäin pyöreä" },
];

export default function StyleFields({
  radius,
  onPreset,
  onRadiusUpdate,
}: StyleFieldsProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-1 text-lg font-semibold text-foreground">Tyyli</h2>
      <p className="mb-3 text-sm text-muted-foreground">
        Valitse valmis teema tai säädä väriä ja muotoja alta.
      </p>

      <div className="grid grid-cols-2 gap-2">
        {THEME_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onPreset(preset)}
            className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            <span
              aria-hidden="true"
              className="h-4 w-4 shrink-0 rounded-full border border-border"
              style={{ backgroundColor: preset.primaryColor }}
            />
            {preset.name}
          </button>
        ))}
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-foreground">
          Kulmien pyöristys
        </label>
        <select
          value={radius ?? "0.375rem"}
          onChange={(e) => onRadiusUpdate(e.target.value)}
          className="mt-2 block w-full rounded-md border border-input px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
        >
          {RADIUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
