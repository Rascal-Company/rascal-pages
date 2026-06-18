import type { ReactNode } from "react";
import type { ThemeConfig } from "@/src/lib/templates";
import { buildSiteThemeVars } from "@/src/lib/site-theme";
import { buildGoogleFontsUrl } from "@/src/lib/fonts";

type SiteThemeRootProps = {
  theme: ThemeConfig;
  templateId?: string;
  children: ReactNode;
};

/**
 * Wraps non-`SiteRenderer` pages (currently the blog) in the same per-site
 * theme context the rendered site uses: injects the palette CSS variables and
 * web fonts and applies the semantic background/foreground, so these pages
 * inherit the site's look instead of a generic white/gray default.
 */
export default function SiteThemeRoot({
  theme,
  templateId,
  children,
}: SiteThemeRootProps) {
  const fontsUrl = buildGoogleFontsUrl(theme.headingFont, theme.bodyFont);
  const style: React.CSSProperties = {
    ...buildSiteThemeVars(theme, templateId),
    ...(theme.headingFont && {
      ["--heading-font" as string]: `'${theme.headingFont}', sans-serif`,
    }),
    ...(theme.bodyFont && {
      ["--body-font" as string]: `'${theme.bodyFont}', sans-serif`,
    }),
  };

  return (
    <div className="min-h-screen bg-background text-foreground" style={style}>
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
      {children}
    </div>
  );
}
