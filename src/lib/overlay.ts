/**
 * Overlay: asiakkaan omalle sivulle snippetillä upotettavat sisältömuutokset.
 * Tämä moduuli sisältää puhtaan logiikan (validointi + variantin valinta),
 * jota käyttävät server actionit ja julkinen config-endpoint.
 */
import type { Brand } from "./types";

export type OverlayVariantId = Brand<string, "OverlayVariantId">;
export type OverlayChangeId = Brand<string, "OverlayChangeId">;

export const OVERLAY_CHANGE_TYPES = ["text", "image", "link", "hide"] as const;
export type OverlayChangeType = (typeof OVERLAY_CHANGE_TYPES)[number];

export type OverlayChange = {
  id: OverlayChangeId;
  selector: string;
  type: OverlayChangeType;
  /** Uusi arvo: teksti, kuvan URL tai linkin URL. Tyhjä hide-tyypille. */
  value: string;
  /** Sormenjälki alkuperäisestä (teksti / src / href) — estää osumisen väärään elementtiin. */
  original: string;
};

/** Kohdennusavaimet, joiden perusteella variantti valitaan. */
export const OVERLAY_MATCH_KEYS = ["utm_term", "utm_campaign", "utm_content", "rp"] as const;
export type OverlayMatchKey = (typeof OVERLAY_MATCH_KEYS)[number];
export type OverlayMatch = Partial<Record<OverlayMatchKey, string>>;

/** Kohdennettava rivi (laskeutumissivu kampanjan originilla). */
export type OverlayTargetRow = {
  target_origin: string;
  path_pattern: string;
  match: OverlayMatch;
  updated_at: string;
};

export function createOverlayVariantId(id: string): OverlayVariantId {
  return id as OverlayVariantId;
}

const MAX_CHANGES = 100;
const MAX_VALUE_LENGTH = 5000;
const MAX_SELECTOR_LENGTH = 1000;

/**
 * Normalisoi kohdesivun URL:n. Hyväksyy vain http(s)-osoitteet.
 * Palauttaa originin ja polun erikseen.
 */
export function parseTargetUrl(
  input: string,
): { origin: string; path: string } | null {
  let raw = input.trim();
  if (!raw) return null;
  if (!/^https?:\/\//i.test(raw)) raw = `https://${raw}`;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username || url.password) return null;
  if (!url.hostname.includes(".")) return null;

  return { origin: url.origin, path: url.pathname || "/" };
}

/**
 * Polkukuvio: tarkka polku ("/hinnasto") tai jokerimerkki ("/blogi/*", "*").
 * Lopun kauttaviiva ei vaikuta vertailuun.
 */
export function matchesPath(pattern: string, pathname: string): boolean {
  const trim = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  const p = trim(pattern.trim() || "*");
  const path = trim(pathname || "/");
  if (p === "*") return true;

  const regex = new RegExp(
    "^" +
      p
        .split("*")
        .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*") +
      "$",
  );
  return regex.test(path);
}

/** Kaikkien variantin kohdennusavainten pitää täsmätä kävijän parametreihin. */
export function matchesQuery(
  match: OverlayMatch,
  params: OverlayMatch,
): boolean {
  return OVERLAY_MATCH_KEYS.every((key) => {
    const expected = match[key]?.trim();
    if (!expected) return true;
    return params[key]?.trim().toLowerCase() === expected.toLowerCase();
  });
}

function specificity(match: OverlayMatch): number {
  return OVERLAY_MATCH_KEYS.filter((key) => match[key]?.trim()).length;
}

/**
 * Valitsee kävijälle näytettävän laskeutumissivun: täsmäävistä tarkimmin
 * kohdennettu, tasatilanteessa viimeksi päivitetty.
 */
export function pickTarget<T extends OverlayTargetRow>(
  rows: T[],
  pageUrl: URL,
  params: OverlayMatch,
): T | null {
  const candidates = rows.filter(
    (v) =>
      v.target_origin === pageUrl.origin &&
      matchesPath(v.path_pattern, pageUrl.pathname) &&
      matchesQuery(v.match, params),
  );

  candidates.sort(
    (a, b) =>
      specificity(b.match) - specificity(a.match) ||
      b.updated_at.localeCompare(a.updated_at),
  );

  return candidates[0] ?? null;
}

/** Validoi ja siistii kohdennuksen (tyhjät avaimet pois). */
export function parseMatch(input: unknown): OverlayMatch {
  const result: OverlayMatch = {};
  if (!input || typeof input !== "object") return result;
  const record = input as Record<string, unknown>;
  for (const key of OVERLAY_MATCH_KEYS) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      result[key] = value.trim().slice(0, 200);
    }
  }
  return result;
}

function isChangeType(value: unknown): value is OverlayChangeType {
  return OVERLAY_CHANGE_TYPES.includes(value as OverlayChangeType);
}

function isSafeUrl(value: string): boolean {
  if (value.startsWith("/") || value.startsWith("#")) return true;
  return /^(https?:|mailto:|tel:)/i.test(value);
}

/**
 * Validoi muutoslistan. Palauttaa virheen ensimmäisestä virheellisestä
 * muutoksesta. URL-arvoille sallitaan vain turvalliset skeemat.
 */
export function parseChanges(
  input: unknown,
): { ok: true; changes: OverlayChange[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "Virheelliset muutokset." };
  if (input.length > MAX_CHANGES) {
    return { ok: false, error: `Enintään ${MAX_CHANGES} muutosta per variantti.` };
  }

  const changes: OverlayChange[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") {
      return { ok: false, error: "Virheellinen muutos." };
    }
    const c = item as Record<string, unknown>;
    const { id, selector, type, value, original } = c;

    if (typeof id !== "string" || !id || id.length > 64) {
      return { ok: false, error: "Muutokselta puuttuu tunniste." };
    }
    if (
      typeof selector !== "string" ||
      !selector.trim() ||
      selector.length > MAX_SELECTOR_LENGTH
    ) {
      return { ok: false, error: "Muutokselta puuttuu elementti." };
    }
    if (!isChangeType(type)) {
      return { ok: false, error: "Tuntematon muutostyyppi." };
    }
    if (typeof value !== "string" || value.length > MAX_VALUE_LENGTH) {
      return { ok: false, error: "Muutoksen arvo on liian pitkä." };
    }
    if (typeof original !== "string" || original.length > MAX_VALUE_LENGTH) {
      return { ok: false, error: "Muutoksen sormenjälki puuttuu." };
    }
    if ((type === "image" || type === "link") && !isSafeUrl(value.trim())) {
      return { ok: false, error: "Osoitteen pitää alkaa https://, / tai mailto:." };
    }
    if (type === "text" && !value.trim()) {
      return { ok: false, error: "Teksti ei voi olla tyhjä — käytä piilotusta." };
    }

    changes.push({
      id: id as OverlayChangeId,
      selector: selector.trim(),
      type,
      value: type === "hide" ? "" : value.trim(),
      original,
    });
  }

  return { ok: true, changes };
}

/**
 * Overlay-sivustolle johdettu subdomain asiakkaan domainista
 * ("https://www.my-shop.fi" → "myshop"). Pages vaatii sivustolle subdomainin,
 * vaikka overlay-sivustoa ei julkaista sen kautta.
 */
export function subdomainFromOrigin(origin: string): string {
  let host: string;
  try {
    host = new URL(origin).hostname;
  } catch {
    return "overlay";
  }
  const label = host.replace(/^www\./, "").split(".")[0] ?? "";
  const clean = label.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30);
  if (!clean) return "overlay";
  // Varatut hostit (app.rascalpages.fi ym.) eivät saa päätyä tenantille.
  return RESERVED_SUBDOMAINS.includes(clean) ? `${clean}site` : clean;
}

const RESERVED_SUBDOMAINS = ["app", "www", "api", "admin", "mail", "home"];

/**
 * Kävijän A/B-variaatio: sama kävijä saa aina saman variaation (FNV-1a-tiiviste
 * kävijätunnisteesta ja laskeutumissivusta). Pidettävä samana kuin o.js:ssä.
 */
export function assignVariant<T extends { id: string }>(
  variants: T[],
  visitorId: string,
  landingPageId: string,
): T | null {
  if (variants.length === 0) return null;
  const sorted = [...variants].sort((a, b) => a.id.localeCompare(b.id));
  return sorted[hashString(`${visitorId}:${landingPageId}`) % sorted.length];
}

export function hashString(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}
