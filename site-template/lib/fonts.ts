/**
 * Google Fonts URL builder. Ported from the Rascal Pages app (src/lib/fonts.ts).
 */

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
