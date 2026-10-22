/**
 * Käsin viimeistellyt asettelupohjat vapaille osioille (RAS-624). Tekoäly
 * valitsee pohjan ja täyttää sen sisällön; koordinaatit tulevat aina täältä,
 * joten generoidut sivut noudattavat samaa rytmiä kuin itse tehdyt.
 * Ruudukko: 24 saraketta, rivi 24 px. Rivit kasvavat sisällön mukaan, joten
 * korkeudet ovat arvioita, joiden tehtävä on pitää välit tasaisina.
 */
import {
  DESKTOP_COLUMNS,
  type FluidAlign,
  type FluidBlock,
  type FluidBlockId,
  type FluidContent,
  type FluidRect,
  type TextVariant,
} from "./fluid";
import type { FaqItem, FormContent, Section, TestimonialItem } from "./templates";
import type { SectionId } from "./types";

export type PatternItem = { title?: string; body?: string; value?: string; label?: string };

export type PatternSlots = {
  eyebrow?: string;
  title?: string;
  body?: string;
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  image?: string;
  imageAlt?: string;
  imageSide?: "left" | "right";
  items?: PatternItem[];
  quote?: string;
  author?: string;
  role?: string;
};

export type PatternSection = {
  pattern: LayoutPatternId;
  slots: PatternSlots;
  /** Nimi navigaatiossa; tyhjä = ei näy. */
  navLabel?: string;
  background?: "default" | "muted";
};

type MakeId = () => string;

type Pattern = {
  /** Kuvaus tekoälylle: milloin pohja sopii ja mitä slotteja se käyttää. */
  description: string;
  /** Palauttaa null, jos pakollinen sisältö puuttuu (osio jätetään pois). */
  build: (slots: PatternSlots, makeId: MakeId) => FluidBlock[] | null;
};

// ---- Korkeusarviot --------------------------------------------------------------

/** Merkin leveys ja rivikorkeus pikseleinä työpöydällä (vastaa FluidBlockView-tyylejä). */
const TYPE_METRICS: Record<TextVariant, { char: number; line: number }> = {
  display: { char: 36, line: 74 },
  h1: { char: 30, line: 63 },
  h2: { char: 19, line: 45 },
  h3: { char: 12.5, line: 32 },
  body: { char: 9.5, line: 30 },
  small: { char: 7.8, line: 23 },
  eyebrow: { char: 9, line: 18 },
};
const COLUMN_PX = 50;
const ROW_PX = 24;

/** Arvioi tekstin korkeuden riveinä annetulla leveydellä. */
export function textRows(text: string, variant: TextVariant, columns: number): number {
  const { char, line } = TYPE_METRICS[variant];
  const perLine = Math.max(8, Math.floor((columns * COLUMN_PX) / char));
  const lines = text
    .split("\n")
    .reduce((sum, paragraph) => sum + Math.max(1, Math.ceil(paragraph.length / perLine)), 0);
  return Math.max(1, Math.ceil((lines * line) / ROW_PX));
}

// ---- Rakennuspalikat --------------------------------------------------------------

function textBlock(makeId: MakeId, rect: FluidRect, variant: TextVariant, text: string, align: FluidAlign = "left"): FluidBlock {
  return { id: makeId() as FluidBlockId, type: "text", desktop: rect, content: { variant, text, align } };
}

function buttonBlock(
  makeId: MakeId,
  rect: FluidRect,
  label: string,
  href: string | undefined,
  variant: "primary" | "secondary",
  align: FluidAlign,
): FluidBlock {
  return { id: makeId() as FluidBlockId, type: "button", desktop: rect, content: { label, href: href || "#", variant, align } };
}

function imageBlock(makeId: MakeId, rect: FluidRect, src: string, alt: string): FluidBlock {
  return { id: makeId() as FluidBlockId, type: "image", desktop: rect, content: { src, alt, fit: "cover", radius: 16 } };
}

function componentBlock<T>(makeId: MakeId, sectionType: "faq" | "testimonials" | "form", data: T): FluidBlock {
  return {
    id: makeId() as FluidBlockId,
    type: "component",
    desktop: { x: 0, y: 0, w: DESKTOP_COLUMNS, h: 12 },
    content: { sectionType, data } as Extract<FluidBlock, { type: "component" }>["content"],
  };
}

const has = (value: string | undefined): value is string => Boolean(value?.trim());

/**
 * Pystypino yhdessä sarakkeessa. Palauttaa lohkot ja seuraavan vapaan rivin.
 * `gap` = tyhjät rivit lohkojen välissä.
 */
function textStack(
  makeId: MakeId,
  column: { x: number; w: number },
  startY: number,
  parts: { variant: TextVariant; text: string | undefined; gapAfter?: number }[],
  align: FluidAlign,
): { blocks: FluidBlock[]; y: number } {
  const blocks: FluidBlock[] = [];
  let y = startY;
  for (const part of parts) {
    if (!has(part.text)) continue;
    const h = textRows(part.text, part.variant, column.w);
    blocks.push(textBlock(makeId, { ...column, y, h }, part.variant, part.text.trim(), align));
    y += h + (part.gapAfter ?? 1);
  }
  return { blocks, y };
}

/** Pää- ja toissijainen painike vierekkäin. Keskitetyssä asettelussa pari keskitetään. */
function buttonRow(makeId: MakeId, slots: PatternSlots, x: number, y: number, align: "left" | "center"): FluidBlock[] {
  const buttons: { label: string; href?: string; variant: "primary" | "secondary" }[] = [];
  if (has(slots.primaryLabel)) buttons.push({ label: slots.primaryLabel.trim(), href: slots.primaryHref, variant: "primary" });
  if (has(slots.secondaryLabel)) buttons.push({ label: slots.secondaryLabel.trim(), href: slots.secondaryHref, variant: "secondary" });
  if (buttons.length === 0) return [];

  const w = 6;
  if (align === "center") {
    if (buttons.length === 1) return [buttonBlock(makeId, { x: 9, y, w, h: 2 }, buttons[0].label, buttons[0].href, buttons[0].variant, "center")];
    return buttons.map((b, i) =>
      buttonBlock(makeId, { x: i === 0 ? 6 : 12, y, w, h: 2 }, b.label, b.href, b.variant, i === 0 ? "right" : "left"),
    );
  }
  return buttons.map((b, i) => buttonBlock(makeId, { x: x + i * (w - 1), y, w: w - 1, h: 2 }, b.label, b.href, b.variant, "left"));
}

/** Sarakkeiden paikat: 2 → 10+4+10, 3 → 6+3+6+3+6, 4 → 6×4 ilman väliä. */
function columnsFor(count: number): { x: number; w: number }[] {
  if (count === 2) return [{ x: 0, w: 10 }, { x: 14, w: 10 }];
  if (count === 4) return [0, 6, 12, 18].map((x) => ({ x, w: 5 }));
  return [{ x: 0, w: 6 }, { x: 9, w: 6 }, { x: 18, w: 6 }];
}

/** Keskitetty otsikko + johdanto osion yläosaan. */
function centeredHeader(makeId: MakeId, slots: PatternSlots): { blocks: FluidBlock[]; y: number } {
  return textStack(
    makeId,
    { x: 4, w: 16 },
    0,
    [
      { variant: "eyebrow", text: slots.eyebrow },
      { variant: "h2", text: slots.title },
      { variant: "body", text: slots.body, gapAfter: 2 },
    ],
    "center",
  );
}

/** Korttiruudukko riveittäin. Kortin sisällä: luku tai otsikko ja leipäteksti. */
function itemGrid(
  makeId: MakeId,
  items: PatternItem[],
  startY: number,
  perRow: number,
  style: "feature" | "stat" | "step",
): FluidBlock[] {
  const blocks: FluidBlock[] = [];
  const columns = columnsFor(perRow);
  let y = startY;
  for (let row = 0; row < items.length; row += perRow) {
    let rowBottom = y;
    items.slice(row, row + perRow).forEach((item, i) => {
      const column = columns[i];
      const parts: { variant: TextVariant; text: string | undefined; gapAfter?: number }[] =
        style === "stat"
          ? [
              { variant: "h1", text: item.value ?? item.title, gapAfter: 0 },
              { variant: "small", text: item.label ?? item.body },
            ]
          : [
              { variant: "eyebrow", text: style === "step" ? String(row + i + 1).padStart(2, "0") : undefined },
              { variant: "h3", text: item.title, gapAfter: 0 },
              { variant: "body", text: item.body },
            ];
      const stack = textStack(makeId, column, y, parts, "left");
      blocks.push(...stack.blocks);
      rowBottom = Math.max(rowBottom, stack.y);
    });
    y = rowBottom + 2;
  }
  return blocks;
}

const validItems = (slots: PatternSlots, min: number, max: number) => {
  const items = (slots.items ?? []).filter((i) => has(i.title) || has(i.value) || has(i.body));
  return items.length >= min ? items.slice(0, max) : null;
};

// ---- Pohjat ----------------------------------------------------------------------

export const LAYOUT_PATTERNS = {
  "hero-centered": {
    description:
      "Pääosio, keskitetty: yläotsikko (eyebrow), iso otsikko (title), lyhyt kuvaus (body), 1–2 painiketta. Sopii, kun referenssin pääosio on keskitetty tai typografiavetoinen.",
    build(slots, makeId) {
      if (!has(slots.title)) return null;
      const stack = textStack(
        makeId,
        { x: 3, w: 18 },
        0,
        [
          { variant: "eyebrow", text: slots.eyebrow },
          { variant: "display", text: slots.title },
          { variant: "body", text: slots.body, gapAfter: 2 },
        ],
        "center",
      );
      return [...stack.blocks, ...buttonRow(makeId, slots, 0, stack.y, "center")];
    },
  },
  "hero-split": {
    description:
      "Pääosio kahdessa sarakkeessa: teksti ja painikkeet toisella puolella, kuva toisella (imageSide). Kuvaksi vain annettu kuvaosoite; ilman sitä jätä image tyhjäksi, niin käyttäjä lisää kuvan.",
    build(slots, makeId) {
      if (!has(slots.title)) return null;
      const imageLeft = slots.imageSide === "left";
      const textColumn = imageLeft ? { x: 13, w: 11 } : { x: 0, w: 12 };
      const stack = textStack(
        makeId,
        textColumn,
        2,
        [
          { variant: "eyebrow", text: slots.eyebrow },
          { variant: "h1", text: slots.title },
          { variant: "body", text: slots.body, gapAfter: 2 },
        ],
        "left",
      );
      const buttons = buttonRow(makeId, slots, textColumn.x, stack.y, "left");
      const bottom = stack.y + (buttons.length ? 2 : 0);
      const image = imageBlock(
        makeId,
        { x: imageLeft ? 0 : 13, y: 0, w: 11, h: Math.max(18, bottom + 2) },
        slots.image?.trim() ?? "",
        slots.imageAlt?.trim() || slots.title.trim(),
      );
      return [...stack.blocks, ...buttons, image];
    },
  },
  "hero-statement": {
    description:
      "Pääosio, jossa yksi iso väite vasemmalle tasattuna koko leveydellä ja lyhyt kuvaus sen alla kapeammassa sarakkeessa. Sopii minimalistisiin, typografiavetoisiin referensseihin.",
    build(slots, makeId) {
      if (!has(slots.title)) return null;
      const stack = textStack(
        makeId,
        { x: 0, w: 22 },
        1,
        [
          { variant: "eyebrow", text: slots.eyebrow },
          { variant: "display", text: slots.title, gapAfter: 2 },
        ],
        "left",
      );
      const body = textStack(makeId, { x: 0, w: 11 }, stack.y, [{ variant: "body", text: slots.body, gapAfter: 2 }], "left");
      return [...stack.blocks, ...body.blocks, ...buttonRow(makeId, slots, 0, body.y, "left")];
    },
  },
  "features-columns": {
    description:
      "Ominaisuudet tai hyödyt sarakkeina: keskitetty otsikko (title) ja johdanto (body), sitten 2–6 kohtaa (items: title + body). 3 tai 6 kohtaa → kolme saraketta, 2 tai 4 → kaksi.",
    build(slots, makeId) {
      const items = validItems(slots, 2, 6);
      if (!items) return null;
      const header = centeredHeader(makeId, slots);
      const perRow = items.length === 2 || items.length === 4 ? 2 : 3;
      return [...header.blocks, ...itemGrid(makeId, items, header.y, perRow, "feature")];
    },
  },
  "steps": {
    description: "Prosessi tai vaiheet numeroituina (01, 02, 03): otsikko ja 3 vaihetta (items: title + body).",
    build(slots, makeId) {
      const items = validItems(slots, 3, 6);
      if (!items) return null;
      const header = centeredHeader(makeId, slots);
      return [...header.blocks, ...itemGrid(makeId, items, header.y, 3, "step")];
    },
  },
  "stats": {
    description:
      "Isot luvut riviin: 3–4 kohtaa (items: value = luku, label = selite), valinnainen otsikko. Käytä vain lukuja, jotka löytyvät yrityksen tiedoista; älä keksi lukuja.",
    build(slots, makeId) {
      const items = validItems(slots, 3, 4);
      if (!items) return null;
      const header = has(slots.title) ? centeredHeader(makeId, slots) : { blocks: [], y: 0 };
      return [...header.blocks, ...itemGrid(makeId, items, header.y, items.length, "stat")];
    },
  },
  "image-text": {
    description:
      "Kuva toisella puolella, toisella otsikko, teksti ja valinnainen painike. Hyvä tarinalle, tuotteen esittelylle tai 'meistä'-osiolle. imageSide vaihtelee osiosta toiseen.",
    build(slots, makeId) {
      if (!has(slots.title) || !has(slots.body)) return null;
      const imageLeft = slots.imageSide !== "right";
      const textColumn = imageLeft ? { x: 13, w: 11 } : { x: 0, w: 11 };
      const stack = textStack(
        makeId,
        textColumn,
        1,
        [
          { variant: "eyebrow", text: slots.eyebrow },
          { variant: "h2", text: slots.title },
          { variant: "body", text: slots.body, gapAfter: 2 },
        ],
        "left",
      );
      const buttons = buttonRow(makeId, slots, textColumn.x, stack.y, "left");
      const bottom = stack.y + (buttons.length ? 2 : 0);
      const image = imageBlock(
        makeId,
        { x: imageLeft ? 0 : 13, y: 0, w: 11, h: Math.max(16, bottom + 1) },
        slots.image?.trim() ?? "",
        slots.imageAlt?.trim() || slots.title.trim(),
      );
      return [image, ...stack.blocks, ...buttons];
    },
  },
  "quote": {
    description: "Yksi iso lainaus keskitettynä (quote, author, role). Käytä vain, jos yrityksen tiedoissa on oikea asiakaspalaute.",
    build(slots, makeId) {
      if (!has(slots.quote) || !has(slots.author)) return null;
      const stack = textStack(
        makeId,
        { x: 3, w: 18 },
        0,
        [
          { variant: "h2", text: `“${slots.quote.trim().replace(/^["“”]|["“”]$/g, "")}”` },
          { variant: "body", text: slots.author, gapAfter: 0 },
          { variant: "small", text: slots.role },
        ],
        "center",
      );
      return stack.blocks;
    },
  },
  "cta-centered": {
    description: "Toimintakehote keskitettynä: otsikko, lyhyt teksti ja 1–2 painiketta. Tyypillisesti sivun loppupuolella.",
    build(slots, makeId) {
      if (!has(slots.title) || !has(slots.primaryLabel)) return null;
      const stack = textStack(
        makeId,
        { x: 4, w: 16 },
        0,
        [
          { variant: "h2", text: slots.title },
          { variant: "body", text: slots.body, gapAfter: 2 },
        ],
        "center",
      );
      return [...stack.blocks, ...buttonRow(makeId, slots, 0, stack.y, "center")];
    },
  },
  "cta-banner": {
    description: "Matala nauha: otsikko vasemmalla, painike oikealla samalla rivillä. Sopii osioiden väliin tai loppuun.",
    build(slots, makeId) {
      if (!has(slots.title) || !has(slots.primaryLabel)) return null;
      const stack = textStack(
        makeId,
        { x: 0, w: 15 },
        0,
        [
          { variant: "h2", text: slots.title, gapAfter: 0 },
          { variant: "body", text: slots.body },
        ],
        "left",
      );
      const height = Math.max(2, stack.y - 1);
      return [
        ...stack.blocks,
        buttonBlock(makeId, { x: 18, y: Math.max(0, Math.floor((height - 2) / 2)), w: 6, h: 2 }, slots.primaryLabel.trim(), slots.primaryHref, "primary", "right"),
      ];
    },
  },
  "faq": {
    description: "Usein kysytyt kysymykset (items: title = kysymys, body = vastaus), 3–8 kpl. Vastaukset vain yrityksen tiedoista.",
    build(slots, makeId) {
      const items = (slots.items ?? []).filter((i) => has(i.title) && has(i.body)).slice(0, 8);
      if (items.length < 2) return null;
      const data: FaqItem[] = items.map((i) => ({ question: i.title!.trim(), answer: i.body!.trim() }));
      return [componentBlock(makeId, "faq", data)];
    },
  },
  "testimonials": {
    description: "Asiakaspalautteet korteissa (items: body = palaute, title = nimi, label = yritys/rooli), 2–3 kpl. Vain oikeita palautteita; älä keksi.",
    build(slots, makeId) {
      const items = (slots.items ?? []).filter((i) => has(i.title) && has(i.body)).slice(0, 3);
      if (items.length < 2) return null;
      const data: TestimonialItem[] = items.map((i) => ({ name: i.title!.trim(), text: i.body!.trim(), company: i.label?.trim() || undefined }));
      return [componentBlock(makeId, "testimonials", data)];
    },
  },
  "contact-form": {
    description: "Yhteydenottolomake (nimi, sähköposti, viesti). title = lomakkeen otsikko, primaryLabel = lähetysnapin teksti. Yleensä sivun lopussa.",
    build(slots, makeId) {
      const data: FormContent = {
        formTitle: slots.title?.trim() || "Ota yhteyttä",
        submitButtonText: slots.primaryLabel?.trim() || "Lähetä",
        fields: [
          { id: "field-name", name: "name", type: "text", label: "Nimi", required: true, placeholder: "Nimesi" },
          { id: "field-email", name: "email", type: "email", label: "Sähköposti", required: true, placeholder: "nimi@esimerkki.fi" },
          { id: "field-message", name: "message", type: "textarea", label: "Viesti", required: false, placeholder: "Kerro lyhyesti, mitä tarvitset" },
        ],
        successMessage: { title: "Kiitos viestistä!", description: slots.body?.trim() || "Palaamme asiaan pian." },
      };
      return [componentBlock(makeId, "form", data)];
    },
  },
} satisfies Record<string, Pattern>;

export type LayoutPatternId = keyof typeof LAYOUT_PATTERNS;
export const LAYOUT_PATTERN_IDS = Object.keys(LAYOUT_PATTERNS) as LayoutPatternId[];

/** Pohjien kuvaukset tekoälyn järjestelmäpromptiin. */
export function describePatterns(): string {
  return LAYOUT_PATTERN_IDS.map((id) => `- ${id}: ${LAYOUT_PATTERNS[id].description}`).join("\n");
}

function anchorFor(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** Rakentaa yhden vapaan osion pohjasta. Puutteellinen sisältö → null. */
export function buildPatternSection(section: PatternSection, makeId: MakeId): Section | null {
  const pattern = LAYOUT_PATTERNS[section.pattern] as Pattern | undefined;
  if (!pattern) return null;
  const blocks = pattern.build(section.slots ?? {}, makeId);
  if (!blocks || blocks.length === 0) return null;

  const navLabel = section.navLabel?.trim();
  const content: FluidContent = { blocks, ...(navLabel && { navLabel, anchor: anchorFor(navLabel) }) };
  return {
    id: makeId() as SectionId,
    type: "fluid",
    content,
    isVisible: true,
    ...(section.background === "muted" && { style: { background: "var(--muted)" } }),
  };
}
