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

/**
 * Semantic surface classes resolved from the site's injected design tokens
 * (see `src/lib/site-theme.ts`). The same classes serve every appearance —
 * light / dark / portfolio differences come from the per-site CSS variables on
 * the rendered site root, not from branching here.
 */
const SURFACE_TOKENS: SurfaceTokens = {
  section: "bg-transparent",
  sectionAlt: "bg-muted/50",
  heading: "text-foreground",
  body: "text-muted-foreground",
  muted: "text-muted-foreground/70",
  card: "bg-card ring-1 ring-border",
  chip: "bg-muted text-muted-foreground ring-1 ring-border",
  divider: "border-border",
};

export function surfaceTokens(): SurfaceTokens {
  return SURFACE_TOKENS;
}
