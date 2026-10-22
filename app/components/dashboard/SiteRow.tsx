"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
  FileText,
  Globe,
  Layers,
  MoreHorizontal,
  MousePointerClick,
  Newspaper,
  Settings,
  Trash2,
  UserRound,
  UsersRound,
} from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import { conversionPercent, percentChange, type SiteKpis } from "@/src/lib/kpi";
import type { SiteKind } from "@/src/lib/site-kind";
import { Change } from "./KpiTile";
import { siteAdminNavItems } from "@/src/lib/site-admin-nav";

export type DashboardSite = {
  id: string;
  subdomain: string;
  custom_domain: string | null;
  published: boolean;
  kind: SiteKind;
  campaignCount: number;
  overlayOrigin: string | null;
  kpis: SiteKpis;
};

const NUMBER = new Intl.NumberFormat("fi-FI");

/** Sarakeasettelu, jonka otsikkorivi ja sivustorivit jakavat. */
export const SITE_ROW_GRID =
  "md:grid md:grid-cols-[minmax(0,1fr)_9rem_6rem_6rem_6rem_7.5rem] md:items-center md:gap-4";

function Metric({ label, value, change }: { label: string; value: string; change?: number | null }) {
  return (
    <div className="md:text-right">
      <p className="text-xs text-muted-foreground md:hidden">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <p className="h-4 text-xs">
        {change !== undefined && change !== null && <Change value={change} compact />}
      </p>
    </div>
  );
}

/** Yksi sivusto listassa: nimi, tila, 30 päivän luvut ja toiminnot. */
export default function SiteRow({
  site,
  publishing,
  onTogglePublish,
  onDelete,
}: {
  site: DashboardSite;
  publishing: boolean;
  onTogglePublish: () => void;
  onDelete: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const url = site.custom_domain
    ? `https://${site.custom_domain}`
    : `https://${site.subdomain}.rascalpages.fi`;
  const base = `/app/dashboard/${site.id}`;
  const isOverlay = site.kind === "overlay";
  const primaryHref = isOverlay ? `${base}/overlay` : base;
  const title = isOverlay
    ? (site.overlayOrigin ?? url).replace(/^https?:\/\/(www\.)?/, "")
    : url.replace(/^https:\/\//, "");
  const { views, leads } = site.kpis;
  // Suorat linkit sivuston osioihin (pääpainike vie editoriin tai kampanjoihin).
  const quickLinks = siteAdminNavItems(site.id, isOverlay ? "overlay" : "pages").filter(
    (item) => item.key !== "editor" && item.key !== "overlay",
  );

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <li className={cn("group px-4 py-4 transition-colors hover:bg-muted/40 md:py-3", SITE_ROW_GRID)}>
      {/* Sivusto */}
      <div className="flex min-w-0 items-center gap-3">
        <Link
          href={primaryHref}
          aria-hidden
          tabIndex={-1}
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            isOverlay ? "bg-accent text-primary" : "bg-muted text-muted-foreground",
          )}
        >
          {isOverlay ? (
            <MousePointerClick className="size-5" />
          ) : site.kind === "portfolio" ? (
            <UserRound className="size-5" />
          ) : (
            <Globe className="size-5" />
          )}
        </Link>
        <div className="min-w-0">
          <Link href={primaryHref} className="block truncate text-sm font-semibold hover:underline">
            {title}
          </Link>
          {isOverlay ? (
            <p className="truncate text-xs text-muted-foreground">
              Overlay · {site.campaignCount} {site.campaignCount === 1 ? "kampanja" : "kampanjaa"}
            </p>
          ) : (
            <button
              type="button"
              onClick={copyUrl}
              title="Kopioi osoite"
              className="inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <span className="truncate">
                {site.kind === "portfolio" ? "Portfolio" : "Laskeutumissivu"}
              </span>
              {copied ? (
                <Check className="size-3 shrink-0 text-success" aria-label="Osoite kopioitu" />
              ) : (
                <Copy
                  className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  aria-hidden
                />
              )}
            </button>
          )}
          <nav aria-label={`${title}: osiot`} className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
            {quickLinks.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Tila */}
      <div className="mt-3 flex items-center gap-2 md:mt-0">
        {isOverlay ? (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <span
              className={cn(
                "size-2 rounded-full",
                site.campaignCount > 0 ? "bg-success" : "bg-muted-foreground/40",
              )}
              aria-hidden
            />
            {site.campaignCount > 0 ? "Käytössä" : "Ei kampanjoita"}
          </span>
        ) : (
          <label className="inline-flex items-center gap-2 text-sm">
            <Switch
              checked={site.published}
              onCheckedChange={onTogglePublish}
              disabled={publishing}
              aria-label={site.published ? "Piilota sivu" : "Julkaise sivu"}
            />
            <span className={site.published ? "" : "text-muted-foreground"}>
              {site.published ? "Julkaistu" : "Luonnos"}
            </span>
          </label>
        )}
      </div>

      {/* Luvut */}
      <div className="mt-3 grid grid-cols-3 gap-3 md:contents">
        <Metric label="Näytöt" value={NUMBER.format(views.current)} change={percentChange(views)} />
        <Metric
          label={isOverlay ? "Konversiot" : "Liidit"}
          value={NUMBER.format(leads.current)}
          change={percentChange(leads)}
        />
        <Metric
          label="Konversio"
          value={`${conversionPercent(leads.current, views.current).toFixed(1).replace(".", ",")} %`}
        />
      </div>

      {/* Toiminnot */}
      <div className="mt-3 flex items-center justify-end gap-1 md:mt-0">
        <Link
          href={primaryHref}
          className="inline-flex h-8 items-center rounded-md border border-input bg-card px-3 text-xs font-medium hover:bg-muted"
        >
          {isOverlay ? "Kampanjat" : "Muokkaa"}
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Lisää toimintoja: ${title}`}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            {isOverlay ? (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`${base}/overlay`}>
                    <Layers className="size-4" aria-hidden />
                    Kampanjat
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${base}/overlay/profiles`}>
                    <UsersRound className="size-4" aria-hidden />
                    Kohderyhmät
                  </Link>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem asChild>
                  <Link href={`${base}/pages`}>
                    <FileText className="size-4" aria-hidden />
                    Sivut
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${base}/posts`}>
                    <Newspaper className="size-4" aria-hidden />
                    Blogi
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${base}/overlay`}>
                    <Layers className="size-4" aria-hidden />
                    Overlay
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`${base}/analytics`}>
                    <BarChart3 className="size-4" aria-hidden />
                    Analytiikka ja liidit
                  </Link>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem asChild>
              <Link href={`${base}/settings`}>
                <Settings className="size-4" aria-hidden />
                Asetukset
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              className="text-destructive focus:bg-destructive/10 focus:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden />
              Poista sivusto
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
