"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BarChart3,
  Check,
  Copy,
  FileText,
  Layers,
  MoreHorizontal,
  MousePointerClick,
  Newspaper,
  Pencil,
  Settings,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import SitePreview from "./SitePreview";

export type DashboardSite = {
  id: string;
  subdomain: string;
  custom_domain: string | null;
  published: boolean;
  kind: "lander" | "overlay";
  campaignCount: number;
  overlayOrigin: string | null;
};

function QuickLink({ href, icon: Icon, label }: { href: string; icon: LucideIcon; label: string }) {
  return (
    <Link
      href={href}
      title={label}
      className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-3.5" aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}

/** Sivustokortti: yksi päätoiminto (avaa), tila yhdellä silmäyksellä, muut toiminnot hillitysti. */
export default function SiteCard({
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

  async function copyUrl() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[box-shadow,border-color] hover:border-foreground/15 hover:shadow-lg hover:shadow-black/5">
      <Link
        href={primaryHref}
        className="relative block overflow-hidden border-b border-border"
        aria-label={`Avaa ${title}`}
      >
        {isOverlay ? (
          <div className="flex h-44 flex-col items-center justify-center gap-2 bg-gradient-to-br from-accent to-muted">
            <span className="flex size-11 items-center justify-center rounded-full bg-card text-primary shadow-sm">
              <MousePointerClick className="size-5" aria-hidden />
            </span>
            <span className="text-xs font-medium text-muted-foreground">
              Personoitu asiakkaan sivulle
            </span>
          </div>
        ) : (
          <SitePreview url={url} published={site.published} title={title} />
        )}
        <span className="absolute inset-0 flex items-center justify-center bg-foreground/0 opacity-0 transition-[opacity,background-color] group-hover:bg-foreground/10 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-semibold shadow-md">
            <Pencil className="size-3.5" aria-hidden />
            {isOverlay ? "Avaa kampanjat" : "Muokkaa"}
          </span>
        </span>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <Link href={primaryHref} className="block truncate font-semibold tracking-tight hover:underline">
              {title}
            </Link>
            {isOverlay ? (
              <p className="mt-0.5 text-xs text-muted-foreground">
                Overlay · {site.campaignCount} {site.campaignCount === 1 ? "kampanja" : "kampanjaa"}
              </p>
            ) : (
              <button
                type="button"
                onClick={copyUrl}
                className="mt-0.5 inline-flex max-w-full items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                title="Kopioi osoite"
              >
                <span className="truncate">{url.replace(/^https:\/\//, "")}</span>
                {copied ? (
                  <Check className="size-3 shrink-0 text-success" aria-label="Kopioitu" />
                ) : (
                  <Copy className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                )}
              </button>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="-mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Lisää toimintoja"
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem asChild>
                <Link href={`${base}/settings`}>
                  <Settings className="size-4" aria-hidden />
                  Asetukset
                </Link>
              </DropdownMenuItem>
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

        {!isOverlay && (
          <label className="mt-3 flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2">
            <span className="flex items-center gap-2 text-sm">
              <span
                className={cn(
                  "size-2 rounded-full",
                  site.published ? "bg-success" : "bg-muted-foreground/40",
                )}
                aria-hidden
              />
              {site.published ? "Julkaistu" : "Luonnos"}
            </span>
            <Switch
              checked={site.published}
              onCheckedChange={onTogglePublish}
              disabled={publishing}
              aria-label={site.published ? "Piilota sivu" : "Julkaise sivu"}
            />
          </label>
        )}

        <nav className="mt-3 flex gap-0.5 border-t border-border pt-2" aria-label="Sivuston osiot">
          {isOverlay ? (
            <>
              <QuickLink href={`${base}/overlay`} icon={Layers} label="Kampanjat" />
              <QuickLink href={`${base}/overlay/profiles`} icon={MousePointerClick} label="Kohderyhmät" />
            </>
          ) : (
            <>
              <QuickLink href={`${base}/pages`} icon={FileText} label="Sivut" />
              <QuickLink href={`${base}/posts`} icon={Newspaper} label="Blogi" />
              <QuickLink href={`${base}/overlay`} icon={Layers} label="Overlay" />
              <QuickLink href={`${base}/analytics`} icon={BarChart3} label="Analytiikka" />
            </>
          )}
        </nav>
      </div>
    </article>
  );
}
