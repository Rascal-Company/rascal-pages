"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2, RotateCcw } from "lucide-react";
import { cn } from "@/src/lib/utils";

/**
 * Kuvan vaihto: esikatselu, lataus napista tai raahaamalla, ja osoitteen
 * liittäminen varavaihtoehtona. Tyhjä arvo = alkuperäinen kuva.
 */
export default function ImageSlotField({
  value,
  original,
  baseUrl,
  onChange,
  upload,
  disabled,
}: {
  value: string;
  original: string;
  /** Asiakkaan sivun osoite, jotta suhteellinen alkuperäinen polku näkyy esikatselussa. */
  baseUrl: string;
  onChange: (url: string) => void;
  upload: (file: File) => Promise<string | null>;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  let previewSrc = value || original;
  try {
    previewSrc = new URL(previewSrc, baseUrl).toString();
  } catch {
    // Näytetään sellaisenaan.
  }

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    const url = await upload(file);
    setUploading(false);
    if (url) onChange(url);
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFile(e.dataTransfer.files[0]);
        }}
        className={cn(
          "group/image relative flex h-28 items-center justify-center overflow-hidden rounded-lg bg-muted ring-1 ring-inset transition-shadow",
          dragging ? "ring-2 ring-primary" : "ring-border",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- asiakkaan ulkoinen kuva */}
        <img src={previewSrc} alt="" className="size-full object-contain" />
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/45 text-xs font-medium text-white backdrop-blur-[2px] transition-opacity",
            dragging || uploading ? "opacity-100" : "opacity-0 group-hover/image:opacity-100 focus-visible:opacity-100",
          )}
        >
          {uploading ? (
            <Loader2 className="size-5 animate-spin" aria-hidden />
          ) : (
            <ImageUp className="size-5" aria-hidden />
          )}
          {uploading ? "Ladataan…" : dragging ? "Pudota kuva" : "Vaihda kuva"}
        </button>
        {value && !uploading && (
          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">
            Vaihdettu
          </span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif,image/svg+xml"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
      <div className="flex items-center gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="…tai liitä kuvan osoite"
          aria-label="Kuvan osoite"
          disabled={disabled}
          className="h-8 min-w-0 flex-1 rounded-md border border-input bg-transparent px-2.5 text-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            title="Palauta alkuperäinen"
            aria-label="Palauta alkuperäinen kuva"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <RotateCcw className="size-3.5" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
