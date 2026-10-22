"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  ChevronLeft,
  ExternalLink,
  FileText,
  Layers,
  Newspaper,
  PencilRuler,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { activeSiteAdminNavKey, siteAdminNavItems, type SiteAdminNavKey, type SiteAdminNavKind } from "@/src/lib/site-admin-nav";
import { cn } from "@/src/lib/utils";

export const SITE_ADMIN_NAV_ICONS: Record<SiteAdminNavKey, LucideIcon> = {
  editor: PencilRuler,
  pages: FileText,
  posts: Newspaper,
  overlay: Layers,
  analytics: BarChart3,
  settings: Settings,
};

export type SiteAdminNavProps = {
  siteId: string;
  kind: SiteAdminNavKind;
  /** Sivuston nimi otsikossa (verkkotunnus). */
  label: string;
  /** Julkinen osoite "Avaa sivusto" -linkille. */
  url: string;
};

/**
 * Sivuston hallintasivujen yläpalkki: paluu sivustolistaan, sivuston nimi ja
 * välilehdet (editori, sivut, blogi, analytiikka, asetukset).
 */
export default function SiteAdminNav({ siteId, kind, label, url }: SiteAdminNavProps) {
  const pathname = usePathname();
  const active = activeSiteAdminNavKey(pathname, siteId);

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link
          href="/app/dashboard"
          className="-ml-2 inline-flex h-8 shrink-0 items-center gap-0.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Sivustot</span>
        </Link>
        <span className="h-5 w-px shrink-0 bg-border" aria-hidden />
        <p className="min-w-0 flex-1 truncate px-1 text-sm font-semibold">{label}</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">Avaa sivusto</span>
        </a>
      </div>
      <nav
        aria-label="Sivuston osiot"
        className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 [scrollbar-width:none] sm:px-4 lg:px-6"
      >
        {siteAdminNavItems(siteId, kind).map((item) => {
          const Icon = SITE_ADMIN_NAV_ICONS[item.key];
          const current = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={cn(
                "relative inline-flex h-10 shrink-0 items-center gap-1.5 px-3 text-sm font-medium transition-colors",
                "after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full",
                current
                  ? "text-foreground after:bg-primary"
                  : "text-muted-foreground hover:text-foreground after:bg-transparent",
              )}
            >
              <Icon className="size-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
