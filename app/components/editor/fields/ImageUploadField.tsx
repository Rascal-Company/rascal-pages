"use client";

import { useRef, useState } from "react";
import { uploadSiteAsset } from "@/app/actions/upload-site-asset";
import { useEditorSite } from "../EditorSiteContext";

type ImageUploadFieldProps = {
  value?: string;
  onChange: (url: string) => void;
  /** Preview shape: rectangular thumbnail or round avatar. */
  shape?: "rect" | "round";
  placeholder?: string;
};

export default function ImageUploadField({
  value,
  onChange,
  shape = "rect",
  placeholder = "https://example.com/kuva.jpg",
}: ImageUploadFieldProps) {
  const siteId = useEditorSite();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadSiteAsset(siteId, formData);

    if ("error" in result) {
      setError(result.error);
    } else {
      onChange(result.url);
    }
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const previewClass =
    shape === "round"
      ? "h-16 w-16 rounded-full object-cover"
      : "h-24 w-auto rounded-md object-cover";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? "Ladataan…" : value ? "Vaihda kuva" : "Lataa kuva"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange("")}
            disabled={isUploading}
            className="text-sm font-medium text-destructive hover:text-destructive disabled:opacity-50"
          >
            Poista
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <input
        type="url"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-md border border-input px-3 py-2 text-sm text-foreground focus:border-ring focus:outline-none focus:ring-ring"
      />

      {error && <p className="text-xs text-destructive">{error}</p>}

      {value && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="Kuvan esikatselu" className={`mt-1 ${previewClass}`} />
      )}
    </div>
  );
}
