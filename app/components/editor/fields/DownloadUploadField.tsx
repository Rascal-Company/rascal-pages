"use client";

import { useRef, useState } from "react";
import { FileDown } from "lucide-react";
import { prepareSiteDownloadUpload } from "@/app/actions/site-download";
import { createClient } from "@/src/utils/supabase/client";
import {
  DOWNLOAD_BUCKET,
  DOWNLOAD_MAX_BYTES,
  DOWNLOAD_MIME_TYPES,
  formatFileSize,
  type DownloadKind,
  type SiteDownload,
} from "@/src/lib/site-downloads";
import { useEditorSite } from "../EditorSiteContext";

/**
 * Ladattava tiedosto landerille (RAS-1115). Tiedosto menee selaimesta suoraan
 * yksityiseen Storageen palvelimen allekirjoittamalla upload-linkillä, koska
 * se on liian suuri server actionin rungoksi.
 */
export default function DownloadUploadField({
  value,
  kind,
  onChange,
}: {
  value?: SiteDownload;
  kind: DownloadKind;
  onChange: (download: SiteDownload | undefined) => void;
}) {
  const siteId = useEditorSite();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (file.size > DOWNLOAD_MAX_BYTES) {
      setError("Tiedosto on liian suuri (enintään 25 Mt).");
      return;
    }
    setIsUploading(true);
    const prepared = await prepareSiteDownloadUpload(siteId, {
      fileName: file.name,
      size: file.size,
      type: file.type,
      kind,
    });
    if ("error" in prepared) {
      setError(prepared.error);
    } else {
      const { error: uploadError } = await createClient()
        .storage.from(DOWNLOAD_BUCKET)
        .uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: file.type });
      if (uploadError) setError("Tiedoston lataus epäonnistui. Yritä uudelleen.");
      else onChange({ path: prepared.path, fileName: file.name, size: file.size });
    }
    setIsUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      {value && (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2 text-sm">
          <FileDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="min-w-0 flex-1 truncate font-medium">{value.fileName}</span>
          <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(value.size)}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-md border border-input bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isUploading ? "Ladataan…" : value ? "Vaihda tiedosto" : "Lataa tiedosto"}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
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
        accept={[...DOWNLOAD_MIME_TYPES].join(",")}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">PDF, ZIP, Office, CSV tai kuva, enintään 25 Mt.</p>
    </div>
  );
}
