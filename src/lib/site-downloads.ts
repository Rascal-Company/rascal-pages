/**
 * Landerin ladattavat tiedostot (RAS-1115). Tiedostot ovat yksityisessä
 * site-downloads-bucketissa polussa <org>/<site>/<kind>/<nimi>:
 * - gated: lomakkeen lahja, linkki vasta lähetyksen jälkeen
 * - public: painikkeen suora lataus /api/download-reitin kautta
 */

export const DOWNLOAD_BUCKET = "site-downloads";
export const DOWNLOAD_MAX_BYTES = 25 * 1024 * 1024;
/** Lomakkeen lahjan linkki on voimassa viikon, jotta se toimii myös sähköpostissa. */
export const GATED_LINK_SECONDS = 7 * 24 * 60 * 60;
/** Suoran latauksen uudelleenohjaus: linkki käytetään heti. */
export const PUBLIC_LINK_SECONDS = 60;

export const DOWNLOAD_KINDS = ["gated", "public"] as const;
export type DownloadKind = (typeof DOWNLOAD_KINDS)[number];

export const DOWNLOAD_MIME_TYPES = new Set([
  "application/pdf",
  "application/zip",
  "application/epub+zip",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "image/png",
  "image/jpeg",
]);

/** Sivulle tallennettu tiedosto (lomakkeen tai painikkeen sisällössä). */
export type SiteDownload = { path: string; fileName: string; size: number };

/** Tiedostonimi polkuun: ääkköset ja erikoismerkit pois, pääte säilyy. */
export function safeFileName(name: string): string {
  const clean = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/-\./g, ".")
    .replace(/^[-.]+|-+$/g, "")
    .slice(-100);
  return clean || "tiedosto";
}

export function downloadPath(
  orgId: string,
  siteId: string,
  kind: DownloadKind,
  fileName: string,
  unique: string,
): string {
  return `${orgId}/${siteId}/${kind}/${unique}-${safeFileName(fileName)}`;
}

/**
 * Tarkistaa, että polku kuuluu sivuston annetun tyyppiseen tiedostoon.
 * Kävijän lähettämään polkuun ei luoteta: ilman tätä lomakkeella voisi
 * pyytää minkä tahansa organisaation tiedoston.
 */
export function isSiteDownloadPath(
  path: string,
  orgId: string,
  siteId: string,
  kind: DownloadKind,
): boolean {
  const prefix = `${orgId}/${siteId}/${kind}/`;
  return (
    path.startsWith(prefix) &&
    path.length > prefix.length &&
    !path.includes("..") &&
    !path.slice(prefix.length).includes("/")
  );
}

/** Alkuperäistä vastaava tiedostonimi polusta (ilman yksilöivää etuliitettä). */
export function downloadFileName(path: string): string {
  const base = path.split("/").pop() ?? "";
  return base.replace(/^[\w-]{10}-/, "") || "tiedosto";
}

/** Suoran latauksen osoite sivustolla (sama origin, /api ohittaa hostiohjauksen). */
export function publicDownloadHref(siteId: string, path: string): string {
  const params = new URLSearchParams({ s: siteId, f: path });
  return `/api/download?${params.toString()}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} kt`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mt`;
}
