/**
 * Vapaa osio (Fluid): osio on ruudukko, jossa lohkot (teksti, kuva, painike)
 * sijoitetaan sarakkeisiin ja riveihin. Työpöydällä 24 saraketta, mobiilissa 8.
 * Mobiiliasettelu on valinnainen: ilman sitä lohkot pinotaan automaattisesti
 * työpöytäjärjestyksessä. Lohkot saavat mennä päällekkäin; taulukon järjestys
 * on pinojärjestys (viimeinen päällimmäisenä).
 */
import type { Brand } from "./types";
import type { SiteDownload } from "./site-downloads";
import type { SectionContentMap, SectionType } from "./templates";

export const DESKTOP_COLUMNS = 24;
export const MOBILE_COLUMNS = 8;
/** Rivin perusyksikkö pikseleinä (rivi kasvaa, jos sisältö ei mahdu). */
export const DESKTOP_ROW_PX = 24;
export const MOBILE_ROW_PX = 20;

export type FluidBlockId = Brand<string, "FluidBlockId">;
export type FluidLayout = "desktop" | "mobile";

export type FluidRect = { x: number; y: number; w: number; h: number };

export type TextVariant = "display" | "h1" | "h2" | "h3" | "body" | "small" | "eyebrow";
export type FluidAlign = "left" | "center" | "right";

export type FluidTextContent = { variant: TextVariant; text: string; align: FluidAlign };
export type FluidImageContent = { src: string; alt: string; fit: "cover" | "contain"; radius: number };
export type FluidButtonContent = {
  label: string;
  href: string;
  variant: "primary" | "secondary" | "link";
  align: FluidAlign;
  /** Liitetty tiedosto: href osoittaa sen suoraan lataukseen (RAS-1115). */
  download?: SiteDownload;
};

/** Valmis osio (lomake, UKK, hinnoittelu…) lohkona vapaan osion sisällä. */
export type ComponentSectionType = Exclude<SectionType, "fluid" | "footer">;
export type FluidComponentContent = {
  sectionType: ComponentSectionType;
  data: SectionContentMap[ComponentSectionType];
};

type BlockBase = { id: FluidBlockId; desktop: FluidRect; mobile?: FluidRect };

export type FluidBlock =
  | (BlockBase & { type: "text"; content: FluidTextContent })
  | (BlockBase & { type: "image"; content: FluidImageContent })
  | (BlockBase & { type: "button"; content: FluidButtonContent })
  | (BlockBase & { type: "component"; content: FluidComponentContent });

export type FluidBlockType = FluidBlock["type"];

export type FluidContent = {
  blocks: FluidBlock[];
  /** Ankkuri (#id), johon navigaatio voi linkittää. */
  anchor?: string;
  /** Nimi sivun navigaatiossa; tyhjä = ei näy navigaatiossa. */
  navLabel?: string;
  /** "cta" = näytetään navigaation korostettuna painikkeena. */
  navStyle?: "link" | "cta";
  /**
   * Osion vähimmäiskorkeus riveinä asettelukohtaisesti. Ilman arvoa osio
   * päättyy alimman lohkon alareunaan; arvolla osion alle jää tyhjää tilaa.
   */
  minRows?: Partial<Record<FluidLayout, number>>;
};

export function columnsFor(layout: FluidLayout): number {
  return layout === "desktop" ? DESKTOP_COLUMNS : MOBILE_COLUMNS;
}

/** Pitää suorakulmion ruudukon sisällä: vähintään 1×1, ei yli reunojen. */
export function clampRect(rect: FluidRect, columns: number): FluidRect {
  const w = Math.min(Math.max(1, Math.round(rect.w)), columns);
  const h = Math.max(1, Math.round(rect.h));
  const x = Math.min(Math.max(0, Math.round(rect.x)), columns - w);
  const y = Math.max(0, Math.round(rect.y));
  return { x, y, w, h };
}

export function moveRect(rect: FluidRect, dx: number, dy: number, columns: number): FluidRect {
  return clampRect({ ...rect, x: rect.x + dx, y: rect.y + dy }, columns);
}

export type ResizeHandle = "e" | "w" | "s" | "n" | "se" | "sw" | "ne" | "nw";

/** Koon muutos kahvasta: vastakkainen reuna pysyy paikallaan. */
export function resizeRect(
  rect: FluidRect,
  handle: ResizeHandle,
  dx: number,
  dy: number,
  columns: number,
): FluidRect {
  let { x, y, w, h } = rect;
  if (handle.includes("e")) w = Math.min(Math.max(1, w + dx), columns - x);
  if (handle.includes("s")) h = Math.max(1, h + dy);
  if (handle.includes("w")) {
    const nextX = Math.min(Math.max(0, x + dx), x + w - 1);
    w = w + (x - nextX);
    x = nextX;
  }
  if (handle.includes("n")) {
    const nextY = Math.min(Math.max(0, y + dy), y + h - 1);
    h = h + (y - nextY);
    y = nextY;
  }
  return clampRect({ x, y, w, h }, columns);
}

/** Työpöytäjärjestys lukusuunnassa: ylhäältä alas, vasemmalta oikealle. */
export function readingOrder(blocks: FluidBlock[]): FluidBlock[] {
  return [...blocks].sort((a, b) => a.desktop.y - b.desktop.y || a.desktop.x - b.desktop.x);
}

/**
 * Automaattinen mobiiliasettelu: lohkot täysleveinä allekkain
 * lukujärjestyksessä. Painikkeet säilyttävät korkeutensa, kuvat skaalautuvat.
 */
export function autoMobileLayout(blocks: FluidBlock[]): Map<string, FluidRect> {
  const result = new Map<string, FluidRect>();
  let y = 0;
  for (const block of readingOrder(blocks)) {
    const scale = block.type === "image" ? MOBILE_COLUMNS / Math.max(1, block.desktop.w) : 1;
    const h = Math.max(1, Math.round(block.desktop.h * Math.min(scale, 1.6)));
    result.set(block.id, { x: 0, y, w: MOBILE_COLUMNS, h });
    y += h + 1;
  }
  return result;
}

/** Lohkon suorakulmio valitussa asettelussa (mobiilissa oma tai automaattinen). */
export function rectFor(
  block: FluidBlock,
  layout: FluidLayout,
  autoMobile: Map<string, FluidRect>,
): FluidRect {
  if (layout === "desktop") return block.desktop;
  return block.mobile ?? autoMobile.get(block.id) ?? { x: 0, y: 0, w: MOBILE_COLUMNS, h: block.desktop.h };
}

/** Osion rivimäärä: alimman lohkon alareuna. */
export function rowCount(rects: FluidRect[]): number {
  return rects.reduce((max, r) => Math.max(max, r.y + r.h), 0);
}

/** Osion rivimäärä: alimman lohkon alareuna tai asetettu vähimmäiskorkeus. */
export function sectionRows(content: FluidContent, rects: FluidRect[], layout: FluidLayout): number {
  return Math.max(rowCount(rects), content.minRows?.[layout] ?? 0);
}

/** Asettaa osion vähimmäiskorkeuden; 0 tai alle lohkojen korkeuden = automaattinen. */
export function withMinRows(
  content: FluidContent,
  layout: FluidLayout,
  rows: number,
  rects: FluidRect[],
): FluidContent {
  const minRows = { ...content.minRows };
  if (rows > rowCount(rects)) minRows[layout] = Math.round(rows);
  else delete minRows[layout];
  const rest: FluidContent = { ...content };
  delete rest.minRows;
  return Object.keys(minRows).length > 0 ? { ...rest, minRows } : rest;
}

/**
 * Lohkoryhmän siirto: sama siirtymä kaikille, rajattuna niin, ettei yksikään
 * lohko mene ruudukon ulkopuolelle (ryhmän muoto säilyy).
 */
export function moveGroup<K extends string>(
  rects: Map<K, FluidRect>,
  dx: number,
  dy: number,
  columns: number,
): Map<K, FluidRect> {
  const all = [...rects.values()];
  if (all.length === 0) return new Map();
  const minX = Math.min(...all.map((r) => r.x));
  const maxRight = Math.max(...all.map((r) => r.x + r.w));
  const minY = Math.min(...all.map((r) => r.y));
  const sx = Math.min(Math.max(Math.round(dx), -minX), columns - maxRight);
  const sy = Math.max(Math.round(dy), -minY);
  const result = new Map<K, FluidRect>();
  for (const [id, r] of rects) result.set(id, { ...r, x: r.x + sx, y: r.y + sy });
  return result;
}

/** Rivit, joihin annetun korkuinen sisältö mahtuu (tekstilohkon kasvatus). */
export function rowsForHeight(px: number, layout: FluidLayout): number {
  const row = layout === "desktop" ? DESKTOP_ROW_PX : MOBILE_ROW_PX;
  return Math.max(1, Math.ceil((px - 0.5) / row));
}

const DEFAULT_SIZE: Record<FluidBlockType, { w: number; h: number }> = {
  text: { w: 12, h: 3 },
  image: { w: 10, h: 12 },
  button: { w: 5, h: 2 },
  component: { w: DESKTOP_COLUMNS, h: 12 },
};

export type FluidContentMap = {
  text: FluidTextContent;
  image: FluidImageContent;
  button: FluidButtonContent;
};

export function defaultBlockContent<T extends keyof FluidContentMap>(type: T): FluidContentMap[T] {
  const contents: FluidContentMap = {
    text: { variant: "body", text: "Kirjoita tähän", align: "left" },
    image: { src: "", alt: "", fit: "cover", radius: 12 },
    button: { label: "Lue lisää", href: "#", variant: "primary", align: "left" },
  };
  return contents[type];
}

/**
 * Uusi lohko osion alle ensimmäiseen vapaaseen kohtaan. Mobiiliasettelu
 * jatkuu samoin, jos osiolla on jo omat mobiilisijainnit.
 */
export function newBlock(
  type: Exclude<FluidBlockType, "component">,
  id: string,
  blocks: FluidBlock[],
  overrides: Partial<FluidTextContent> = {},
): FluidBlock {
  const size = DEFAULT_SIZE[type];
  const desktop = clampRect(
    { x: 0, y: rowCount(blocks.map((b) => b.desktop)), ...size },
    DESKTOP_COLUMNS,
  );
  const hasMobile = blocks.some((b) => b.mobile);
  const mobile = hasMobile
    ? { x: 0, y: rowCount(blocks.map((b) => b.mobile ?? b.desktop)) + 1, w: MOBILE_COLUMNS, h: size.h }
    : undefined;
  const base = { id: id as FluidBlockId, desktop, ...(mobile && { mobile }) };
  if (type === "text") {
    return { ...base, type, content: { ...defaultBlockContent("text"), ...overrides } };
  }
  if (type === "image") return { ...base, type, content: defaultBlockContent("image") };
  return { ...base, type, content: defaultBlockContent("button") };
}

/** Valmis osio lohkoksi osion alle, koko leveydelle. */
export function newComponentBlock(
  sectionType: ComponentSectionType,
  data: SectionContentMap[ComponentSectionType],
  id: string,
  blocks: FluidBlock[],
): FluidBlock {
  const desktop = { x: 0, y: rowCount(blocks.map((b) => b.desktop)), ...DEFAULT_SIZE.component };
  const hasMobile = blocks.some((b) => b.mobile);
  return {
    id: id as FluidBlockId,
    type: "component",
    desktop,
    ...(hasMobile && {
      mobile: {
        x: 0,
        y: rowCount(blocks.map((b) => b.mobile ?? b.desktop)) + 1,
        w: MOBILE_COLUMNS,
        h: DEFAULT_SIZE.component.h,
      },
    }),
    content: { sectionType, data },
  };
}

/** Navigaation ankkuri nimestä: "Meistä & tiimi" → "meista-tiimi". */
export function slugifyAnchor(label: string): string {
  return label
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

/** Päivittää lohkon suorakulmion valitussa asettelussa. */
export function withRect(block: FluidBlock, layout: FluidLayout, rect: FluidRect): FluidBlock {
  return layout === "desktop" ? { ...block, desktop: rect } : { ...block, mobile: rect };
}

/**
 * Kun mobiiliasettelua muokataan ensimmäistä kertaa, kaikki lohkot saavat
 * automaattisen sijaintinsa omaksi, jotta yhden siirto ei sotke muita.
 */
export function materializeMobile(blocks: FluidBlock[]): FluidBlock[] {
  if (blocks.every((b) => b.mobile)) return blocks;
  const auto = autoMobileLayout(blocks);
  return blocks.map((b) => (b.mobile ? b : { ...b, mobile: auto.get(b.id) }));
}

/** Uuden vapaan osion aloitussisältö: otsikko, teksti ja painike. */
export function defaultFluidContent(makeId: () => string): FluidContent {
  return {
    blocks: [
      {
        id: makeId() as FluidBlockId,
        type: "text",
        desktop: { x: 0, y: 0, w: 16, h: 4 },
        content: { variant: "h1", text: "Otsikko, joka sanoo olennaisen", align: "left" },
      },
      {
        id: makeId() as FluidBlockId,
        type: "text",
        desktop: { x: 0, y: 5, w: 12, h: 3 },
        content: {
          variant: "body",
          text: "Raahaa lohkoja vapaasti, muuta niiden kokoa kulmista ja kirjoita suoraan sivulle.",
          align: "left",
        },
      },
      {
        id: makeId() as FluidBlockId,
        type: "button",
        desktop: { x: 0, y: 9, w: 5, h: 2 },
        content: { label: "Ota yhteyttä", href: "#", variant: "primary", align: "left" },
      },
    ],
  };
}

/**
 * Osio, jossa on pelkkiä täysleveitä valmiita osioita, renderöidään "paljaana":
 * valmis osio näyttää täsmälleen omalta itseltään ilman ruudukon reunuksia.
 */
export function isBareComponentSection(blocks: FluidBlock[]): boolean {
  return (
    blocks.length > 0 &&
    blocks.every((b) => b.type === "component" && b.desktop.x === 0 && b.desktop.w === DESKTOP_COLUMNS)
  );
}

/** Ensimmäisen valmiin pääosion sisältö (portfolion navigaatio ja lomakkeet tarvitsevat sitä). */
export function findComponentData<T extends ComponentSectionType>(
  blocks: FluidBlock[],
  sectionType: T,
): SectionContentMap[T] | undefined {
  const block = blocks.find((b) => b.type === "component" && b.content.sectionType === sectionType);
  return block?.type === "component" ? (block.content.data as SectionContentMap[T]) : undefined;
}
