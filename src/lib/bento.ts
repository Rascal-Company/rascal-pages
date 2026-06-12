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
};

/**
 * Lowest free row beneath all existing items, so a newly added element drops
 * below the current layout instead of overlapping it. Returns 0 for an empty
 * grid.
 */
export function nextFreeY(items: BentoItem[]): number {
  return items.reduce((maxY, item) => Math.max(maxY, item.y + item.h), 0);
}
