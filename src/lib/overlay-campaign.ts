/**
 * Overlay-kampanjat: kampanja (asiakkaan sivusto) → laskeutumissivu
 * (kohdennus, profiili ja elementtilista eli slotit) → variaatiot
 * (overlay_variants), jotka täyttävät slotteihin omat arvonsa. Snippetin
 * käyttämät muutokset johdetaan slotit × arvot -parista, joten o.js ei tiedä
 * sloteista mitään.
 */
import type { Brand } from "./types";
import {
  OVERLAY_CHANGE_TYPES,
  parseChanges,
  type OverlayChange,
  type OverlayChangeId,
  type OverlayChangeType,
} from "./overlay";

export type OverlayCampaignId = Brand<string, "OverlayCampaignId">;
export type OverlaySlotId = Brand<string, "OverlaySlotId">;

export type OverlayLandingPageId = Brand<string, "OverlayLandingPageId">;
export type OverlayProfileId = Brand<string, "OverlayProfileId">;

export function createOverlayCampaignId(id: string): OverlayCampaignId {
  return id as OverlayCampaignId;
}

export function createOverlayLandingPageId(id: string): OverlayLandingPageId {
  return id as OverlayLandingPageId;
}

export function createOverlayProfileId(id: string): OverlayProfileId {
  return id as OverlayProfileId;
}

export type OverlaySlot = {
  id: OverlaySlotId;
  /** Ihmisen antama nimi, esim. "Pääotsikko". Annetaan myös AI:lle. */
  label: string;
  selector: string;
  type: OverlayChangeType;
  /** Alkuperäinen sisältö = sormenjälki (teksti / src / href / tagin nimi). */
  original: string;
};

/** Kohderyhmän arvot sloteittain. Piilotuksessa arvo "1" = piilota. */
export type OverlaySlotValues = Record<string, string>;

const MAX_SLOTS = 50;
const MAX_LABEL_LENGTH = 80;

/** Validoi slotit samoilla säännöillä kuin muutokset (selektori, tyyppi, sormenjälki). */
export function parseSlots(
  input: unknown,
): { ok: true; slots: OverlaySlot[] } | { ok: false; error: string } {
  if (!Array.isArray(input)) return { ok: false, error: "Virheellinen elementtilista." };
  if (input.length > MAX_SLOTS) {
    return { ok: false, error: `Enintään ${MAX_SLOTS} elementtiä per kampanja.` };
  }

  const slots: OverlaySlot[] = [];
  for (const item of input) {
    const s = (item ?? {}) as Record<string, unknown>;
    const label = typeof s.label === "string" ? s.label.trim() : "";
    if (!label) return { ok: false, error: "Anna jokaiselle elementille nimi." };
    if (!OVERLAY_CHANGE_TYPES.includes(s.type as OverlayChangeType)) {
      return { ok: false, error: "Tuntematon elementin tyyppi." };
    }
    // Rakenne tarkistetaan muutosvalidaattorilla paikkamerkkiarvolla.
    const asChange = parseChanges([
      { id: s.id, selector: s.selector, type: "hide", value: "", original: s.original },
    ]);
    if (!asChange.ok) return asChange;
    const c = asChange.changes[0];

    slots.push({
      id: c.id as unknown as OverlaySlotId,
      label: label.slice(0, MAX_LABEL_LENGTH),
      selector: c.selector,
      type: s.type as OverlayChangeType,
      original: c.original,
    });
  }

  const ids = new Set(slots.map((s) => s.id));
  if (ids.size !== slots.length) return { ok: false, error: "Elementtien tunnisteet toistuvat." };
  return { ok: true, slots };
}

/** Pitää vain olemassa olevien slottien merkkijonoarvot. */
export function parseSlotValues(input: unknown, slots: OverlaySlot[]): OverlaySlotValues {
  const values: OverlaySlotValues = {};
  if (!input || typeof input !== "object") return values;
  const record = input as Record<string, unknown>;
  for (const slot of slots) {
    const value = record[slot.id];
    if (typeof value === "string") values[slot.id] = value.slice(0, 5000);
  }
  return values;
}

/**
 * Muodostaa kohderyhmän muutokset. Tyhjä arvo = elementti pysyy ennallaan.
 * Tulos validoidaan samalla validaattorilla kuin käsin tehdyt muutokset.
 */
export function buildChanges(
  slots: OverlaySlot[],
  values: OverlaySlotValues,
): { ok: true; changes: OverlayChange[] } | { ok: false; error: string } {
  const raw: OverlayChange[] = [];
  for (const slot of slots) {
    const value = (values[slot.id] ?? "").trim();
    if (slot.type === "hide") {
      if (value !== "1") continue;
    } else if (!value || value === slot.original) {
      continue;
    }
    raw.push({
      id: slot.id as unknown as OverlayChangeId,
      selector: slot.selector,
      type: slot.type,
      value: slot.type === "hide" ? "" : value,
      original: slot.original,
    });
  }

  // Tarkistetaan muutos kerrallaan, jotta virhe voidaan liittää oikeaan elementtiin.
  for (const change of raw) {
    const single = parseChanges([change]);
    if (!single.ok) {
      const label = slots.find((s) => (s.id as string) === (change.id as string))?.label;
      return { ok: false, error: label ? `${label}: ${single.error}` : single.error };
    }
  }
  return parseChanges(raw);
}

/** Rascal AI:n organisaatioprofiili (public.users), josta AI saa brändikontekstin. */
export type BrandContext = {
  companyName: string | null;
  website: string | null;
  industry: string | null;
  language: string | null;
  companySummary: unknown;
  icpSummary: unknown;
  buyerPersona: string | null;
  tov: unknown;
  voiceAnchor: unknown;
};

/** Laskeutumissivun profiili ja variaation kulma (A/B-variaatioiden erottaja). */
export type CopyBrief = {
  profile: { name: string; description: string } | null;
  angle: string;
};

function section(title: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  if (!text || text === "{}" || text === "[]" || text === "null") return "";
  return `<${title}>\n${text}\n</${title}>\n`;
}

/** Slotit, joihin AI kirjoittaa tekstin. Kuvat, linkit ja piilotukset jäävät käsin tehtäviksi. */
export function textSlots(slots: OverlaySlot[]): OverlaySlot[] {
  return slots.filter((s) => s.type === "text");
}

/**
 * Järjestelmäkehote: pysyvä osa (rooli + brändi) ensin, jotta saman asiakkaan
 * peräkkäiset generoinnit voivat hyödyntää välimuistia.
 */
export function buildCopySystemPrompt(brand: BrandContext): string {
  const language = brand.language?.trim() || "suomi";
  return [
    "Olet kokenut konversio-copywriter. Kirjoitat asiakkaan olemassa olevalle verkkosivulle kohderyhmäkohtaiset tekstit, jotka korvaavat sivun alkuperäiset tekstit tietyille kävijöille (esim. mainoksesta tulevat).",
    "",
    "Periaatteet:",
    "- Pidä jokaisen tekstin rooli ja mittaluokka: otsikko pysyy otsikkona, napin teksti napin mittaisena. Pituus enintään noin 1,3-kertainen alkuperäiseen.",
    "- Puhu kohderyhmän kieltä, heidän tilanteestaan ja hyödyistään. Älä keksi faktoja, lukuja, asiakkaita tai lupauksia, joita brändikontekstissa ei ole.",
    "- Noudata yrityksen äänensävyä ja vältä sitä, mitä äänensävyohje käskee välttämään.",
    `- Kirjoita kielellä: ${language}.`,
    "- Jos alkuperäinen teksti on jo hyvä tälle kohderyhmälle, voit palauttaa sen lähes ennallaan.",
    "",
    "Yrityksen brändikonteksti (Rascal AI -profiili):",
    section("yritys", brand.companyName),
    section("verkkosivu", brand.website),
    section("toimiala", brand.industry),
    section("yrityskuvaus", brand.companySummary),
    section("ihanneasiakas", brand.icpSummary),
    section("ostajapersoona", brand.buyerPersona),
    section("aanensavy", brand.tov),
    section("aaniankkuri", brand.voiceAnchor),
  ]
    .filter((line) => line !== "")
    .join("\n");
}

export function buildCopyUserPrompt(brief: CopyBrief, slots: OverlaySlot[]): string {
  const elements = textSlots(slots)
    .map((s) => `- id: ${s.id}\n  nimi: ${s.label}\n  alkuperäinen: ${s.original}`)
    .join("\n");
  const profile = brief.profile
    ? `${brief.profile.name.trim()}\n\n${brief.profile.description.trim()}`
    : "";
  return [
    profile
      ? section("kohderyhma", profile)
      : "Kohderyhmää ei ole määritelty — kirjoita yrityksen ihanneasiakkaalle.\n",
    section("variaation_kulma", brief.angle.trim()),
    "Kirjoita uusi teksti jokaiselle alla olevalle sivun elementille tälle kohderyhmälle" +
      (brief.angle.trim() ? " variaation kulmaa noudattaen" : "") +
      ". Palauta jokaiselle elementille sen id ja teksti.",
    "",
    elements,
  ].join("\n");
}

/** Strukturoidun vastauksen skeema: { texts: [{ id, text }] } */
export const COPY_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    texts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          text: { type: "string" },
        },
        required: ["id", "text"],
        additionalProperties: false,
      },
    },
  },
  required: ["texts"],
  additionalProperties: false,
} as const;

/** Poimii mallin vastauksesta vain tunnettujen tekstislottien arvot. */
export function parseGeneratedTexts(raw: string, slots: OverlaySlot[]): OverlaySlotValues {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return {};
  }
  const texts = (data as { texts?: unknown })?.texts;
  if (!Array.isArray(texts)) return {};

  const allowed = new Set(textSlots(slots).map((s) => s.id as string));
  const values: OverlaySlotValues = {};
  for (const item of texts) {
    const { id, text } = (item ?? {}) as { id?: unknown; text?: unknown };
    if (typeof id === "string" && typeof text === "string" && allowed.has(id) && text.trim()) {
      values[id] = text.trim().slice(0, 5000);
    }
  }
  return values;
}
