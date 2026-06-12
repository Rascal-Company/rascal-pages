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

/**
 * Light tokens tuned specifically for the Portfolio template so the light
 * appearance matches the editorial polish of the dark variant: near-white
 * surfaces, a cooler near-black text scale, and hairline rings instead of
 * heavier borders. Kept separate from LIGHT_TOKENS so other templates
 * (saas-modern, lead-magnet, etc.) are not affected.
 */
const PORTFOLIO_LIGHT_TOKENS: SurfaceTokens = {
  section: "bg-transparent",
  sectionAlt: "bg-[#fafafa]",
  heading: "text-[#18181b]",
  body: "text-[#52525b]",
  muted: "text-[#71717a]",
  card: "bg-white ring-1 ring-[#e4e4e7]",
  chip: "bg-[#f4f4f5] text-[#3f3f46] ring-1 ring-[#e4e4e7]",
  divider: "border-[#e4e4e7]",
};

export function surfaceTokens(
  theme: Pick<ThemeConfig, "appearance">,
  templateId?: string,
): SurfaceTokens {
  if (isDarkAppearance(theme)) return DARK_TOKENS;
  if (templateId === "portfolio") return PORTFOLIO_LIGHT_TOKENS;
  return LIGHT_TOKENS;
}
