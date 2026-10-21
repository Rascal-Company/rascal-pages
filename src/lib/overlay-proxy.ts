/**
 * Overlay-editorin proxy: hakee asiakkaan sivun palvelimella ja valmistelee
 * sen näytettäväksi editorin iframessa.
 *
 * Tietoturva: proxattu sivu ajetaan meidän originissamme, joten asiakkaan
 * omat skriptit poistetaan ja CSP sallii vain omat skriptimme. Muuten sivun
 * JS pääsisi käsiksi editoijan sessioon.
 */
import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const MAX_REDIRECTS = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const TIMEOUT_MS = 10_000;

/** Yksityiset, loopback-, link-local- ym. osoitteet, joihin proxy ei saa ottaa yhteyttä. */
export function isPrivateAddress(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) {
    const [a, b] = ip.split(".").map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (version === 6) {
    const lower = ip.toLowerCase();
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
    return (
      lower === "::" ||
      lower === "::1" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe8") ||
      lower.startsWith("fe9") ||
      lower.startsWith("fea") ||
      lower.startsWith("feb") ||
      lower.startsWith("ff")
    );
  }
  return true;
}

async function assertPublicUrl(url: URL): Promise<void> {
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Vain http(s)-osoitteet ovat sallittuja.");
  }
  if (url.port && url.port !== "80" && url.port !== "443") {
    throw new Error("Vain oletusportit ovat sallittuja.");
  }
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host)
    ? [{ address: host }]
    : await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateAddress(a.address))) {
    throw new Error("Osoite ei ole julkinen.");
  }
}

async function readLimited(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      throw new Error("Sivu on liian suuri.");
    }
    chunks.push(value);
  }
  return new TextDecoder("utf-8").decode(Buffer.concat(chunks));
}

/**
 * Hakee sivun HTML:n. Uudelleenohjaukset seurataan käsin, jotta jokainen
 * hyppy tarkistetaan (SSRF). Palauttaa lopullisen URL:n base-tagia varten.
 */
export async function fetchPublicHtml(
  start: URL,
): Promise<{ html: string; finalUrl: URL }> {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertPublicUrl(url);
    const res = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; RascalPagesOverlay/1.0; +https://rascalpages.fi)",
        Accept: "text/html,application/xhtml+xml",
      },
    });

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error("Virheellinen uudelleenohjaus.");
      url = new URL(location, url);
      continue;
    }
    if (!res.ok) throw new Error(`Sivu vastasi virheellä ${res.status}.`);
    const type = res.headers.get("content-type") || "";
    if (!type.includes("text/html")) throw new Error("Osoite ei ole HTML-sivu.");

    return { html: await readLimited(res), finalUrl: url };
  }
  throw new Error("Liian monta uudelleenohjausta.");
}

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

/**
 * Poistaa skriptit, CSP-/refresh-metat ja base-tagit, ja lisää headin alkuun
 * base-tagin (assetit latautuvat asiakkaan palvelimelta) sekä overlay-skriptin
 * esikatselutilassa.
 */
export function rewriteProxiedHtml(
  html: string,
  baseUrl: string,
  overlayScriptUrl: string,
): string {
  const cleaned = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<script\b[^>]*\/>/gi, "")
    .replace(/<meta\b[^>]*http-equiv\s*=\s*["']?(content-security-policy|refresh)[^>]*>/gi, "")
    .replace(/<base\b[^>]*>/gi, "");

  const inject =
    `<base href="${escapeAttr(baseUrl)}">` +
    `<script src="${escapeAttr(overlayScriptUrl)}" data-rp-preview></script>`;

  if (/<head\b[^>]*>/i.test(cleaned)) {
    return cleaned.replace(/<head\b[^>]*>/i, (tag) => tag + inject);
  }
  return inject + cleaned;
}

/** CSP proxatulle sivulle: tyylit ja kuvat mistä tahansa, skriptit vain meiltä. */
export function proxyCsp(appOrigin: string): string {
  return [
    "default-src * data: blob:",
    "style-src * data: blob: 'unsafe-inline'",
    `script-src ${appOrigin}`,
    "object-src 'none'",
    "form-action 'none'",
    "frame-ancestors 'self'",
  ].join("; ");
}
