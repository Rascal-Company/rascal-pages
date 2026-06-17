import type {
  ImageDisplay,
  ImagePosition,
  ImageRounding,
  ImageSize,
} from "./templates";

/**
 * Pure mapping from an `ImageDisplay` config to the Tailwind classes a block
 * uses to render its image in "box" mode. Kept free of React/DOM so it is
 * trivially unit-testable and shared across blocks.
 */

const SIZE_CLASS: Record<ImageSize, string> = {
  sm: "max-w-[16rem]",
  md: "max-w-sm",
  lg: "max-w-lg",
};

const ROUNDING_CLASS: Record<ImageRounding, string> = {
  none: "rounded-none",
  rounded: "rounded-2xl",
  circle: "rounded-full",
};

const THUMB_SIZE_CLASS: Record<ImageSize, string> = {
  sm: "h-12 w-12",
  md: "h-16 w-16",
  lg: "h-24 w-24",
};

const BANNER_HEIGHT_CLASS: Record<ImageSize, string> = {
  sm: "h-40",
  md: "h-52",
  lg: "h-64",
};

export const DEFAULT_IMAGE_SIZE: ImageSize = "md";
export const DEFAULT_IMAGE_ROUNDING: ImageRounding = "rounded";
export const DEFAULT_IMAGE_POSITION: ImagePosition = "right";

/** True when the image should render as a contained box rather than a background. */
export function isBoxMode(display: ImageDisplay | undefined): boolean {
  return display?.mode === "box";
}

/** Box position relative to the text column. */
export function imagePosition(
  display: ImageDisplay | undefined,
): ImagePosition {
  return display?.position ?? DEFAULT_IMAGE_POSITION;
}

/**
 * Classes for the image element itself in box mode: width cap, corner rounding,
 * and `object-cover`. Circle rounding forces a square aspect so it stays round.
 */
export function imageBoxClassName(display: ImageDisplay | undefined): string {
  const size = display?.size ?? DEFAULT_IMAGE_SIZE;
  const rounding = display?.rounding ?? DEFAULT_IMAGE_ROUNDING;

  return [
    "w-full",
    SIZE_CLASS[size],
    ROUNDING_CLASS[rounding],
    "object-cover",
    rounding === "circle" ? "aspect-square" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Square thumbnail / avatar used by card-grid blocks (features, testimonials):
 * `size` sets the fixed dimensions, `rounding` the corner shape.
 */
export function cardThumbClassName(display: ImageDisplay | undefined): string {
  const size = display?.size ?? DEFAULT_IMAGE_SIZE;
  const rounding = display?.rounding ?? DEFAULT_IMAGE_ROUNDING;
  return `${THUMB_SIZE_CLASS[size]} object-cover ${ROUNDING_CLASS[rounding]}`;
}

/**
 * Full-width banner used by the cases cards: `size` sets the height. Rounding
 * is intentionally not applied — the card clips the banner to its own corners.
 */
export function bannerImageClassName(
  display: ImageDisplay | undefined,
): string {
  const size = display?.size ?? DEFAULT_IMAGE_SIZE;
  return `${BANNER_HEIGHT_CLASS[size]} w-full object-cover`;
}

/** Corner rounding only, for images that fill their own box (bento). */
export function imageRoundingClassName(
  display: ImageDisplay | undefined,
): string {
  return ROUNDING_CLASS[display?.rounding ?? DEFAULT_IMAGE_ROUNDING];
}
