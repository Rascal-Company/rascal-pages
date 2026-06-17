"use client";

import type {
  ImageDisplay,
  ImageMode,
  ImagePosition,
  ImageRounding,
  ImageSize,
} from "@/src/lib/templates";
import {
  DEFAULT_IMAGE_POSITION,
  DEFAULT_IMAGE_ROUNDING,
  DEFAULT_IMAGE_SIZE,
} from "@/src/lib/image-display";

type ImageDisplayControlsProps = {
  value?: ImageDisplay;
  onChange: (patch: Partial<ImageDisplay>) => void;
};

type Option<T> = { value: T; label: string };

const MODE_OPTIONS: Option<ImageMode>[] = [
  { value: "background", label: "Taustakuva" },
  { value: "box", label: "Laatikko" },
];

const POSITION_OPTIONS: Option<ImagePosition>[] = [
  { value: "left", label: "Vasen" },
  { value: "right", label: "Oikea" },
];

const SIZE_OPTIONS: Option<ImageSize>[] = [
  { value: "sm", label: "Pieni" },
  { value: "md", label: "Keski" },
  { value: "lg", label: "Suuri" },
];

const ROUNDING_OPTIONS: Option<ImageRounding>[] = [
  { value: "none", label: "Terävä" },
  { value: "rounded", label: "Pyöristetty" },
  { value: "circle", label: "Ympyrä" },
];

function Segmented<T extends string>({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string;
  options: Option<T>[];
  selected: T | undefined;
  onSelect: (value: T) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <div
        className="mt-1.5 grid gap-1"
        style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}
      >
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
              selected === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-foreground hover:bg-accent"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Controls how a block's image is presented: background vs. box, and (in box
 * mode) its position, size and corner rounding. Shared by every block that
 * accepts a single prominent image.
 */
export default function ImageDisplayControls({
  value,
  onChange,
}: ImageDisplayControlsProps) {
  const isBox = value?.mode === "box";

  return (
    <div className="space-y-3 rounded-md border border-border bg-muted/30 p-3">
      <Segmented
        label="Kuvan esitystapa"
        options={MODE_OPTIONS}
        selected={value?.mode}
        onSelect={(mode) => onChange({ mode })}
      />

      {isBox && (
        <>
          <Segmented
            label="Sijainti"
            options={POSITION_OPTIONS}
            selected={value?.position ?? DEFAULT_IMAGE_POSITION}
            onSelect={(position) => onChange({ position })}
          />
          <Segmented
            label="Koko"
            options={SIZE_OPTIONS}
            selected={value?.size ?? DEFAULT_IMAGE_SIZE}
            onSelect={(size) => onChange({ size })}
          />
          <Segmented
            label="Pyöristys"
            options={ROUNDING_OPTIONS}
            selected={value?.rounding ?? DEFAULT_IMAGE_ROUNDING}
            onSelect={(rounding) => onChange({ rounding })}
          />
        </>
      )}
    </div>
  );
}
