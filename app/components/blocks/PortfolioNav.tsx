"use client";

import type { ThemeConfig } from "@/src/lib/templates";

export type PortfolioNavItem = { label: string; href: string };

type PortfolioNavProps = {
  name: string;
  items: PortfolioNavItem[];
  cta?: PortfolioNavItem;
  theme: Pick<ThemeConfig, "primaryColor" | "appearance">;
};

/**
 * Sticky top navigation for the Portfolio template. Renders the person's name,
 * anchor links to the sections present on the page, and a contact CTA. Theme
 * aware (dark/light) and gated to the portfolio template by the renderer, so
 * other templates are unaffected.
 */
export default function PortfolioNav({
  name,
  items,
  cta,
  theme,
}: PortfolioNavProps) {
  const primaryColor = theme.primaryColor || "#3b82f6";

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <a
          href="#"
          className="truncate text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--heading-font, inherit)" }}
        >
          {name}
        </a>

        <div className="flex items-center gap-6 md:gap-8">
          <div className="hidden items-center gap-8 md:flex">
            {items.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </div>

          {cta && (
            <a
              href={cta.href}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
              style={{ backgroundColor: primaryColor }}
            >
              {cta.label}
            </a>
          )}
        </div>
      </nav>
    </header>
  );
}
