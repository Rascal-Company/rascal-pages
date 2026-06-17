import type { BentoElementType, BentoItem } from "./templates";

/** Number of columns in the bento grid. */
export const BENTO_COLUMNS = 12;

/**
 * Default size (in grid cells) for a freshly added element of each type.
 * Stats and buttons are small; headings span wide; images are blocky.
 */
export const BENTO_DEFAULT_SIZE: Record<
  BentoElementType,
  { w: number; h: number }
> = {
  heading: { w: 6, h: 1 },
  text: { w: 6, h: 2 },
  image: { w: 4, h: 3 },
  button: { w: 3, h: 1 },
  stat: { w: 3, h: 2 },
  card: { w: 6, h: 3 },
};

/**
 * Lowest free row beneath all existing items, so a newly added element drops
 * below the current layout instead of overlapping it. Returns 0 for an empty
 * grid.
 */
export function nextFreeY(items: BentoItem[]): number {
  return items.reduce((maxY, item) => Math.max(maxY, item.y + item.h), 0);
}

/** Whether an element sits on a raised card surface by default. */
export function defaultBoxed(type: BentoElementType): boolean {
  return type === "stat" || type === "card";
}

/**
 * Resolve whether an item renders boxed: explicit `boxed` wins, otherwise the
 * per-type default. Images never get a card (they fill their cell).
 */
export function isBoxed(item: BentoItem): boolean {
  if (item.type === "image") return false;
  return item.boxed ?? defaultBoxed(item.type);
}

/** Items ordered for a single-column mobile stack: top-to-bottom, then left-to-right. */
export function itemsInReadingOrder(items: BentoItem[]): BentoItem[] {
  return [...items].sort((a, b) => a.y - b.y || a.x - b.x);
}
