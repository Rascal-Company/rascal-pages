import type { ThemeConfig } from "@/src/lib/templates";

export type Appearance = "light" | "dark";

export function isDarkAppearance(
  theme: Pick<ThemeConfig, "appearance">,
): boolean {
  return theme.appearance === "dark";
}

/**
 * Semantic class tokens for a section, resolved from the page appearance.
 * Keeping the palette in one place lets every block share the same dark
 * portfolio look (and the same light landing-page look) without each block
 * re-deriving colors. Light values reproduce the pre-existing block styling
 * exactly, so templates that don't opt into dark mode are unchanged.
 */
export type SurfaceTokens = {
  /** Default section background (transparent so the page bg shows through). */
  section: string;
  /** Slightly raised alternate section background (e.g. blog strip). */
  sectionAlt: string;
  heading: string;
  body: string;
  muted: string;
  card: string;
  chip: string;
  divider: string;
};

const DARK_TOKENS: SurfaceTokens = {
  section: "bg-transparent",
  sectionAlt: "bg-white/[0.02]",
  heading: "text-[#f5f5f7]",
  body: "text-[#a1a1aa]",
  muted: "text-[#71717a]",
  card: "bg-[#121214] ring-1 ring-[#232327]",
  chip: "bg-white/[0.04] text-[#a1a1aa] ring-1 ring-[#232327]",
  divider: "border-[#232327]",
};

const LIGHT_TOKENS: SurfaceTokens = {
  section: "bg-transparent",
  sectionAlt: "bg-gray-50",
  heading: "text-gray-900",
  body: "text-gray-600",
  muted: "text-gray-500",
  card: "bg-gray-50 ring-1 ring-gray-200",
  chip: "bg-white text-gray-700 ring-1 ring-gray-200",
  divider: "border-gray-200",
};

export function surfaceTokens(
  theme: Pick<ThemeConfig, "appearance">,
): SurfaceTokens {
  return isDarkAppearance(theme) ? DARK_TOKENS : LIGHT_TOKENS;
}
