export const FONT_OPTIONS = [
  { id: "inter", name: "Inter", category: "sans-serif" },
  { id: "poppins", name: "Poppins", category: "sans-serif" },
  { id: "roboto", name: "Roboto", category: "sans-serif" },
  { id: "open-sans", name: "Open Sans", category: "sans-serif" },
  { id: "lato", name: "Lato", category: "sans-serif" },
  { id: "montserrat", name: "Montserrat", category: "sans-serif" },
  { id: "raleway", name: "Raleway", category: "sans-serif" },
  { id: "playfair-display", name: "Playfair Display", category: "serif" },
  { id: "merriweather", name: "Merriweather", category: "serif" },
  { id: "lora", name: "Lora", category: "serif" },
  { id: "dm-sans", name: "DM Sans", category: "sans-serif" },
  { id: "space-grotesk", name: "Space Grotesk", category: "sans-serif" },
  { id: "geist", name: "Geist", category: "sans-serif" },
] as const;

export type FontOption = (typeof FONT_OPTIONS)[number];

export function buildGoogleFontsUrl(
  headingFont?: string,
  bodyFont?: string,
): string | null {
  const fonts = new Set<string>();
  if (headingFont) fonts.add(headingFont);
  if (bodyFont) fonts.add(bodyFont);
  if (fonts.size === 0) return null;

  const families = [...fonts]
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
