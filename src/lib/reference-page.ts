/**
 * Sivu referenssisivujen pohjalta (RAS-624): tekoälyn syöte, vastauksen
 * skeema ja vastauksen muunnos sivuksi. Puhdas moduuli; Claude-kutsu on
 * tiedostossa reference-ai.ts ja haku reference-fetch.ts:ssä.
 */
import { FONT_OPTIONS } from "./fonts";
import {
  LAYOUT_PATTERN_IDS,
  buildPatternSection,
  describePatterns,
  type LayoutPatternId,
  type PatternSection,
  type PatternSlots,
} from "./layout-patterns";
import type { BrandContext } from "./overlay-campaign";
import type { ReferenceSkeleton } from "./reference-skeleton";
import type { Section, SitePalette, TemplateConfig, ThemeConfig } from "./templates";
import type { SectionId } from "./types";

/** inspiration = muiden sivut (vain tyyli ja rakenne), own = oma sivu (sisältöä ja kuvia saa käyttää). */
export type ReferenceMode = "inspiration" | "own";

export type ReferenceBrief = {
  mode: ReferenceMode;
  /** Mitä sivulla tavoitellaan: tarjous, kohderyhmä, toivottu toimenpide. */
  goal: string;
};

const RADIUS_OPTIONS = ["0rem", "0.375rem", "0.75rem", "1.25rem", "9999px"] as const;
const FONT_NAMES = FONT_OPTIONS.map((f) => f.name);

const SLOT_STRING = { type: "string" } as const;

export const REFERENCE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    styleSummary: {
      type: "string",
      description: "1–3 virkettä: mitä referensseistä otettiin (rytmi, typografia, värit, osiorakenne).",
    },
    siteTitle: { type: "string" },
    metaDescription: { type: "string" },
    theme: {
      type: "object",
      properties: {
        appearance: { type: "string", enum: ["light", "dark"] },
        primaryColor: { type: "string", description: "Hex, esim. #1a73e8" },
        background: { type: "string", description: "Sivun taustaväri hexinä" },
        foreground: { type: "string", description: "Tekstin väri hexinä" },
        muted: { type: "string", description: "Vaihtoehtoisen osiotaustan väri hexinä" },
        headingFont: { type: "string", enum: FONT_NAMES },
        bodyFont: { type: "string", enum: FONT_NAMES },
        radius: { type: "string", enum: [...RADIUS_OPTIONS] },
      },
      required: ["appearance", "primaryColor", "background", "foreground", "muted", "headingFont", "bodyFont", "radius"],
      additionalProperties: false,
    },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pattern: { type: "string", enum: LAYOUT_PATTERN_IDS },
          navLabel: { type: "string", description: "Lyhyt nimi navigaatioon tai tyhjä" },
          background: { type: "string", enum: ["default", "muted"] },
          slots: {
            type: "object",
            properties: {
              eyebrow: SLOT_STRING,
              title: SLOT_STRING,
              body: SLOT_STRING,
              primaryLabel: SLOT_STRING,
              primaryHref: SLOT_STRING,
              secondaryLabel: SLOT_STRING,
              secondaryHref: SLOT_STRING,
              image: SLOT_STRING,
              imageAlt: SLOT_STRING,
              imageSide: { type: "string", enum: ["left", "right"] },
              quote: SLOT_STRING,
              author: SLOT_STRING,
              role: SLOT_STRING,
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: { title: SLOT_STRING, body: SLOT_STRING, value: SLOT_STRING, label: SLOT_STRING },
                  required: ["title", "body", "value", "label"],
                  additionalProperties: false,
                },
              },
            },
            // Kaikki pakollisia: valinnaiset kentät tekevät skeemasta API:lle liian monimutkaisen.
            // Käyttämättömät slotit palautetaan tyhjinä merkkijonoina tai tyhjänä listana.
            required: [
              "eyebrow", "title", "body", "primaryLabel", "primaryHref", "secondaryLabel", "secondaryHref",
              "image", "imageAlt", "imageSide", "quote", "author", "role", "items",
            ],
            additionalProperties: false,
          },
        },
        required: ["pattern", "navLabel", "background", "slots"],
        additionalProperties: false,
      },
    },
  },
  required: ["styleSummary", "siteTitle", "metaDescription", "theme", "sections"],
  additionalProperties: false,
} as const;

// ---- Prompt ----------------------------------------------------------------------

function tagged(title: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const text = typeof value === "string" ? value : JSON.stringify(value, null, 2);
  if (!text || text === "{}" || text === "[]" || text === "null") return "";
  return `<${title}>\n${text}\n</${title}>`;
}

/** Järjestelmäprompti on vakio (välimuistiin): rooli, periaatteet ja pohjat. */
export function buildReferenceSystemPrompt(): string {
  return [
    "Olet kokenut verkkosivusuunnittelija ja konversio-copywriter. Teet yritykselle yhden laskeutumissivun, jonka ilme ja rytmi perustuvat käyttäjän antamiin referenssisivuihin.",
    "",
    "Saat jokaisesta referenssistä tiivistetyn HTML-rungon (tagit, luokat, tekstien alut ja pituudet), värit yleisyysjärjestyksessä, fontit ja CSS-muuttujat. Päättele niistä:",
    "- osioiden järjestys ja tyypit (pääosion tyyli, sarakkeet, luvut, kuva+teksti, lainaukset, CTA:t)",
    "- typografian luonne (serif vs. groteski, iso ja ilmava vs. tiivis) ja tekstien mittaluokka",
    "- väripaletti: päätoimintoväri (painikkeet, linkit), tausta, teksti, vaihtoehtoinen osiotausta; tumma vai vaalea",
    "- kulmien pyöristys luokista (rounded-*, --radius) ja muuttujista",
    "",
    "Sivun rakentaminen:",
    "- Rakennat sivun VAIN alla luetelluista asettelupohjista. Valitse pohjat, jotka vastaavat referenssin osioita ja rytmiä, ja täytä niiden slotit.",
    "- 5–9 osiota. Ensimmäinen on pääosio (hero-*). Viimeinen on cta-centered, cta-banner tai contact-form.",
    "- Vaihtele imageSide-arvoa peräkkäisissä kuva-osioissa. Käytä background: muted harkiten erottamaan osioita, ei joka toisessa.",
    "- Kaikki slotit ovat pakollisia kenttiä: jätä pohjalle tarpeettomat tyhjiksi merkkijonoiksi ja items tyhjäksi listaksi.",
    "- navLabel 3–5 tärkeimmälle osiolle (esim. Palvelut, Miten toimii, Ota yhteyttä), muille tyhjä merkkijono.",
    "- Linkit: sivun sisäiset ankkurit muodossa #ankkuri, jossa ankkuri on navLabel pienillä kirjaimilla ja väliviivoilla ilman ääkkösiä (Ota yhteyttä → #ota-yhteytta). Muuten täysi https-osoite yrityksen tiedoista.",
    "- Fontit valitaan sallitusta listasta lähimmäksi referenssin fonttia (serif → serif, geometrinen groteski → geometrinen).",
    "- Värien on oltava luettavia: tekstin ja taustan kontrasti vähintään 4.5:1. Tummassa teemassa tausta tumma ja teksti vaalea.",
    "",
    "Sisältö:",
    "- Kirjoita sisältö yrityksestä brändikontekstin ja käyttäjän tavoitteen perusteella. Älä keksi lukuja, asiakkaita, palautteita, palkintoja tai lupauksia, joita tiedoissa ei ole. Jos lukuja tai palautteita ei ole, älä käytä stats-, quote- tai testimonials-pohjia.",
    "- Otsikot ovat lyhyitä ja konkreettisia. Ei kliseitä (\"vie liiketoimintasi uudelle tasolle\", \"ratkaisut, jotka toimivat\"). Leipätekstit 1–3 virkettä.",
    "- Noudata yrityksen äänensävyä.",
    "",
    "Tekijänoikeus:",
    "- Tilassa inspiration referenssit ovat muiden yritysten sivuja: ota niistä vain asettelu, rytmi ja tyyli. ÄLÄ kopioi tekstejä, iskulauseita, nimiä, logoja tai kuvia. Jätä image-slotit tyhjiksi; käyttäjä lisää omat kuvat.",
    "- Tilassa own referenssi on yrityksen oma sivu: saat käyttää sen tekstejä ja kuvia. Kuvaksi kelpaa vain osoite referenssin kuvalistasta sellaisenaan.",
    "",
    "Asettelupohjat:",
    describePatterns(),
  ].join("\n");
}

export function buildReferenceUserPrompt(
  brand: BrandContext,
  brief: ReferenceBrief,
  references: ReferenceSkeleton[],
): string {
  const language = brand.language?.trim() || "suomi";
  const refs = references.map((ref, i) =>
    [
      `<referenssi numero="${i + 1}" url="${ref.url}">`,
      tagged("otsikko", ref.title),
      tagged("kuvaus", ref.description),
      tagged("fontit", ref.fonts.join(", ")),
      tagged("varit", ref.colors.join(", ")),
      tagged("css_muuttujat", ref.cssVars),
      brief.mode === "own" ? tagged("kuvat", ref.images.join("\n")) : "",
      tagged("runko", ref.outline),
      "</referenssi>",
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `Tila: ${brief.mode}`,
    `Kieli: ${language}`,
    "",
    tagged("tavoite", brief.goal.trim() || "Esittele yritys ja saa kävijä ottamaan yhteyttä."),
    "",
    "Yrityksen brändikonteksti (Rascal AI -profiili):",
    tagged("yritys", brand.companyName),
    tagged("verkkosivu", brand.website),
    tagged("toimiala", brand.industry),
    tagged("yrityskuvaus", brand.companySummary),
    tagged("ihanneasiakas", brand.icpSummary),
    tagged("ostajapersoona", brand.buyerPersona),
    tagged("aanensavy", brand.tov),
    tagged("aaniankkuri", brand.voiceAnchor),
    "",
    ...refs,
  ]
    .filter((line, i, all) => line !== "" || all[i - 1] !== "")
    .join("\n");
}

// ---- Vastauksen muunnos -------------------------------------------------------------

type RawSection = { pattern?: unknown; navLabel?: unknown; background?: unknown; slots?: unknown };

export type ReferencePageResult = {
  content: TemplateConfig;
  siteTitle: string;
  styleSummary: string;
};

const HEX = /^#[0-9a-f]{6}$/i;

function hex(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const v = value.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return HEX.test(v) ? v : undefined;
}

function luminance(color: string): number {
  const channel = (i: number) => {
    const c = parseInt(color.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Teema mallin vastauksesta. Epäkelvot arvot pudotetaan, jolloin sivuston oletukset pätevät. */
export function parseTheme(raw: unknown): ThemeConfig {
  const t = (raw ?? {}) as Record<string, unknown>;
  const appearance = t.appearance === "dark" ? "dark" : "light";
  const primary = hex(t.primaryColor) ?? "#2563eb";
  const font = (value: unknown) => (typeof value === "string" && FONT_NAMES.includes(value as never) ? value : undefined);
  const radius = RADIUS_OPTIONS.includes(t.radius as never) ? (t.radius as string) : undefined;

  const palette: SitePalette = {
    primaryForeground: contrastRatio(primary, "#ffffff") >= 3 ? "#ffffff" : "#111111",
  };
  const background = hex(t.background);
  const foreground = hex(t.foreground);
  // Paletti otetaan vain luettavana; muuten jäädään teeman oletuksiin.
  if (background && foreground && contrastRatio(background, foreground) >= 4.5) {
    const backgroundIsDark = luminance(background) < 0.2;
    if (backgroundIsDark === (appearance === "dark")) {
      palette.background = background;
      palette.foreground = foreground;
      palette.card = background;
      palette.cardForeground = foreground;
      const muted = hex(t.muted);
      if (muted && contrastRatio(muted, foreground) >= 4.5) palette.muted = muted;
    }
  }

  return {
    primaryColor: primary,
    appearance,
    ...(font(t.headingFont) && { headingFont: font(t.headingFont) }),
    ...(font(t.bodyFont) && { bodyFont: font(t.bodyFont) }),
    ...(radius && { radius }),
    palette,
  };
}

const SAFE_HREF = /^(#[a-z0-9-]*|https?:\/\/[^\s"<>]+|mailto:[^\s"<>]+|tel:[+\d\s()-]+)$/i;

/** Puhdistaa slotit: vain merkkijonot, turvalliset linkit ja sallitut kuvat. */
export function sanitizeSlots(raw: unknown, allowedImages: ReadonlySet<string>): PatternSlots {
  const s = (raw ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max = 600) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);
  const href = (v: unknown) => {
    const value = str(v, 500);
    return value && SAFE_HREF.test(value) ? value : value ? "#" : undefined;
  };
  const image = str(s.image, 2000);
  const items = Array.isArray(s.items)
    ? s.items.slice(0, 8).map((item) => {
        const i = (item ?? {}) as Record<string, unknown>;
        return { title: str(i.title, 160), body: str(i.body, 600), value: str(i.value, 24), label: str(i.label, 120) };
      })
    : undefined;

  return {
    eyebrow: str(s.eyebrow, 60),
    title: str(s.title, 200),
    body: str(s.body, 900),
    primaryLabel: str(s.primaryLabel, 40),
    primaryHref: href(s.primaryHref),
    secondaryLabel: str(s.secondaryLabel, 40),
    secondaryHref: href(s.secondaryHref),
    image: image && allowedImages.has(image) ? image : undefined,
    imageAlt: str(s.imageAlt, 200),
    imageSide: s.imageSide === "left" ? "left" : s.imageSide === "right" ? "right" : undefined,
    quote: str(s.quote, 400),
    author: str(s.author, 80),
    role: str(s.role, 120),
    items,
  };
}

/**
 * Mallin JSON-vastaus sivuksi. Tuntemattomat pohjat ja puutteelliset osiot
 * jätetään pois. Palauttaa null, jos käyttökelpoista sivua ei synny.
 */
export function parseReferencePage(
  raw: string,
  allowedImages: ReadonlySet<string>,
  makeId: () => string,
): ReferencePageResult | null {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
  if (!Array.isArray(data.sections)) return null;

  const sections: Section[] = [];
  for (const rawSection of data.sections as RawSection[]) {
    if (!LAYOUT_PATTERN_IDS.includes(rawSection?.pattern as LayoutPatternId)) continue;
    const section: PatternSection = {
      pattern: rawSection.pattern as LayoutPatternId,
      slots: sanitizeSlots(rawSection.slots, allowedImages),
      navLabel: typeof rawSection.navLabel === "string" ? rawSection.navLabel.slice(0, 30) : undefined,
      background: rawSection.background === "muted" ? "muted" : "default",
    };
    const built = buildPatternSection(section, makeId);
    if (built) sections.push(built);
  }
  if (sections.length < 2) return null;

  sections.push({ id: makeId() as SectionId, type: "footer", content: null, isVisible: true });

  const siteTitle = typeof data.siteTitle === "string" ? data.siteTitle.trim().slice(0, 80) : "";
  const metaDescription = typeof data.metaDescription === "string" ? data.metaDescription.trim().slice(0, 300) : "";
  return {
    siteTitle,
    styleSummary: typeof data.styleSummary === "string" ? data.styleSummary.trim().slice(0, 600) : "",
    content: {
      templateId: "blank",
      theme: parseTheme(data.theme),
      sections,
      seo: { ...(siteTitle && { metaTitle: siteTitle }), ...(metaDescription && { metaDescription }) },
    },
  };
}
