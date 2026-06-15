"use client";

import type { SectionStyle } from "@/src/lib/templates";

type SectionStyleInspectorProps = {
  style?: SectionStyle;
  onChange: (patch: Partial<SectionStyle>) => void;
};

const PADDING_OPTIONS: { value: NonNullable<SectionStyle["paddingY"]>; label: string }[] = [
  { value: "none", label: "Ei" },
  { value: "sm", label: "Pieni" },
  { value: "md", label: "Keski" },
  { value: "lg", label: "Suuri" },
];

const ALIGN_OPTIONS: { value: NonNullable<SectionStyle["align"]>; label: string }[] = [
  { value: "left", label: "Vasen" },
  { value: "center", label: "Keski" },
  { value: "right", label: "Oikea" },
];

export default function SectionStyleInspector({
  style,
  onChange,
}: SectionStyleInspectorProps) {
  const background = style?.background ?? "";

  return (
    <div className="rounded-lg border border-border p-4">
      <h3 className="mb-3 text-sm font-semibold text-foreground">Osion tyyli</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground">
          Tausta
        </label>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="color"
            value={background || "#ffffff"}
            onChange={(e) => onChange({ background: e.target.value })}
            className="h-9 w-12 cursor-pointer rounded border border-input"
          />
          <input
            type="text"
            value={background}
            onChange={(e) => onChange({ background: e.target.value || undefined })}
            placeholder="esim. #f5f5f5 tai tyhjä"
            className="block w-full rounded-md border border-input px-3 py-1.5 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
          />
          {background && (
            <button
              type="button"
              onClick={() => onChange({ background: undefined })}
              className="shrink-0 text-sm font-medium text-muted-foreground hover:text-foreground"
            >
              Poista
            </button>
          )}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-foreground">
          Pystysuora tila
        </label>
        <div className="mt-2 grid grid-cols-4 gap-1">
          {PADDING_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ paddingY: option.value })}
              className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                (style?.paddingY ?? "none") === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:bg-accent"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground">
          Tekstin linjaus
        </label>
        <div className="mt-2 grid grid-cols-3 gap-1">
          {ALIGN_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange({ align: option.value })}
              className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                style?.align === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:bg-accent"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
