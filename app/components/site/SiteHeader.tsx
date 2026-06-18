"use client";

import Link from "next/link";
import { useState } from "react";
import type { ThemeConfig } from "@/src/lib/templates";
import type { SiteNavLink } from "@/src/lib/site-nav";

type SiteHeaderProps = {
  brand: string;
  links: SiteNavLink[];
  theme: Pick<ThemeConfig, "primaryColor">;
  /** Current path (e.g. "/", "/palvelut", "/blog") used to mark the active link. */
  currentPath?: string;
};

function isActive(href: string, currentPath?: string): boolean {
  if (!currentPath) return false;
  if (href === "/") return currentPath === "/";
  return currentPath === href || currentPath.startsWith(`${href}/`);
}

/**
 * Shared, theme-aware top navigation rendered across the home page, subpages
 * and the blog so cross-page navigation stays consistent. Uses the semantic
 * site theme tokens (`bg-background`, `text-foreground`, …) so it inherits each
 * site's palette.
 */
export default function SiteHeader({
  brand,
  links,
  theme,
  currentPath,
}: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const primaryColor = theme.primaryColor || "#3b82f6";
  const homeLink = links.find((l) => l.href === "/");
  const menuLinks = links.filter((l) => l.href !== "/");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4 lg:px-8">
        <Link
          href={homeLink?.href ?? "/"}
          className="shrink-0 truncate text-lg font-semibold text-foreground"
          style={{ fontFamily: "var(--heading-font, inherit)" }}
        >
          {brand || homeLink?.label || "Etusivu"}
        </Link>

        <div className="hidden flex-wrap items-center justify-end gap-x-6 gap-y-2 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href, currentPath) ? "page" : undefined}
              className={
                isActive(link.href, currentPath)
                  ? "text-sm font-medium text-foreground"
                  : "text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Valikko"
          aria-expanded={open}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-foreground md:hidden"
          style={{ color: primaryColor }}
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </nav>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-3 lg:px-8">
            {menuLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                aria-current={
                  isActive(link.href, currentPath) ? "page" : undefined
                }
                className={
                  isActive(link.href, currentPath)
                    ? "rounded-md px-2 py-2 text-sm font-medium text-foreground"
                    : "rounded-md px-2 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
