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
