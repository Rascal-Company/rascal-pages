/**
 * Per-site theme engine. Resolves a site's ThemeConfig into a set of CSS custom
 * properties (the @rascal/theme token contract) that are injected on the
 * rendered site root. Blocks then use the shared semantic Tailwind utilities
 * (`bg-primary`, `text-foreground`, …) which resolve to these per-site values,
 * so the same site can be re-themed without touching block markup.
 */

import type { SitePalette, ThemeConfig } from "./templates";

export type SiteThemeVars = Record<`--${string}`, string>;

type SurfaceBase = {
  background: string;
  foreground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  border: string;
};

/** Light base reproduces the existing light block styling (gray scale). */
const LIGHT_BASE: SurfaceBase = {
  background: "#ffffff",
  foreground: "#111827",
  muted: "#f3f4f6",
  mutedForeground: "#6b7280",
  card: "#f9fafb",
  cardForeground: "#111827",
  border: "#e5e7eb",
};

/** Dark base reproduces the polished dark portfolio look. */
const DARK_BASE: SurfaceBase = {
  background: "#0a0a0b",
  foreground: "#f5f5f7",
  muted: "#18181b",
  mutedForeground: "#a1a1aa",
  card: "#121214",
  cardForeground: "#f5f5f7",
  border: "#232327",
};

export const DEFAULT_PRIMARY = "#3B82F6";

function pickBase(theme: Pick<ThemeConfig, "appearance">): SurfaceBase {
  return theme.appearance === "dark" ? DARK_BASE : LIGHT_BASE;
}

/**
 * Build the CSS custom properties for a site. Explicit palette values win;
 * anything unset falls back to the appearance base, and `primary` falls back to
 * the legacy `primaryColor`.
 */
export function buildSiteThemeVars(theme: ThemeConfig): SiteThemeVars {
  const base = pickBase(theme);
  const palette: SitePalette = theme.palette ?? {};
  const primary =
    palette.primary?.trim() || theme.primaryColor?.trim() || DEFAULT_PRIMARY;

  const vars: SiteThemeVars = {
    "--primary": primary,
    "--primary-foreground": palette.primaryForeground ?? "#ffffff",
    "--background": palette.background ?? base.background,
    "--foreground": palette.foreground ?? base.foreground,
    "--muted": palette.muted ?? base.muted,
    "--muted-foreground": palette.mutedForeground ?? base.mutedForeground,
    "--card": palette.card ?? base.card,
    "--card-foreground": palette.cardForeground ?? base.cardForeground,
    "--border": palette.border ?? base.border,
  };

  if (theme.radius) {
    vars["--radius"] = theme.radius;
  }

  return vars;
}

export type ThemePreset = {
  id: string;
  name: string;
  appearance: "light" | "dark";
  primaryColor: string;
  palette?: SitePalette;
};

/** Curated starting palettes shown in the editor Style panel. */
export const THEME_PRESETS: ThemePreset[] = [
  { id: "clean-light", name: "Vaalea", appearance: "light", primaryColor: "#3B82F6" },
  { id: "midnight", name: "Tumma", appearance: "dark", primaryColor: "#6366F1" },
  { id: "forest", name: "Metsä", appearance: "light", primaryColor: "#10B981" },
  { id: "sunset", name: "Auringonlasku", appearance: "light", primaryColor: "#EF4444" },
  {
    id: "mono",
    name: "Mono",
    appearance: "light",
    primaryColor: "#111827",
    palette: { background: "#ffffff", foreground: "#111827" },
  },
];
