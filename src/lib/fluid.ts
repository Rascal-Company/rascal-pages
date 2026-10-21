/**
 * Vapaa osio (Fluid): osio on ruudukko, jossa lohkot (teksti, kuva, painike)
 * sijoitetaan sarakkeisiin ja riveihin. Työpöydällä 24 saraketta, mobiilissa 8.
 * Mobiiliasettelu on valinnainen: ilman sitä lohkot pinotaan automaattisesti
 * työpöytäjärjestyksessä. Lohkot saavat mennä päällekkäin; taulukon järjestys
 * on pinojärjestys (viimeinen päällimmäisenä).
 */
import type { Brand } from "./types";

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
};

type BlockBase = { id: FluidBlockId; desktop: FluidRect; mobile?: FluidRect };

export type FluidBlock =
  | (BlockBase & { type: "text"; content: FluidTextContent })
  | (BlockBase & { type: "image"; content: FluidImageContent })
  | (BlockBase & { type: "button"; content: FluidButtonContent });

export type FluidBlockType = FluidBlock["type"];

export type FluidContent = { blocks: FluidBlock[] };

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

const DEFAULT_SIZE: Record<FluidBlockType, { w: number; h: number }> = {
  text: { w: 12, h: 3 },
  image: { w: 10, h: 12 },
  button: { w: 5, h: 2 },
};

export type FluidContentMap = {
  text: FluidTextContent;
  image: FluidImageContent;
  button: FluidButtonContent;
};

export function defaultBlockContent<T extends FluidBlockType>(type: T): FluidContentMap[T] {
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
  type: FluidBlockType,
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
