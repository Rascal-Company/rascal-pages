"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  Monitor,
  PanelLeft,
  Redo2,
  Rocket,
  Settings,
  Smartphone,
  Tablet,
  Undo2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import SegmentedControl from "@/app/components/ui/segmented-control";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { cn } from "@/src/lib/utils";
import type { SiteId } from "@/src/lib/types";
import type { AutosaveStatus } from "./hooks/useAutosave";
import type { PreviewDevice } from "./EditorPreview";
import { useSitePages } from "./SitePagesContext";

function IconButton({
  label,
  onClick,
  disabled,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95 disabled:pointer-events-none disabled:opacity-35 motion-reduce:active:scale-100 [&_svg]:size-4",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SaveState({ status, lastSavedAt }: { status: AutosaveStatus; lastSavedAt: Date | null }) {
  const label =
    status === "saving"
      ? "Tallennetaan…"
      : status === "error"
        ? "Tallennus epäonnistui"
        : status === "saved" && lastSavedAt
          ? `Tallennettu ${lastSavedAt.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })}`
          : "Muutokset tallentuvat automaattisesti";
  return (
    <span
      aria-live="polite"
      className={cn(
        "hidden items-center gap-1.5 text-xs xl:inline-flex",
        status === "error" ? "text-destructive" : "text-muted-foreground",
      )}
    >
      {status === "saving" ? (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      ) : (
        <span
          className={cn("size-1.5 rounded-full", status === "error" ? "bg-destructive" : "bg-success")}
          aria-hidden
        />
      )}
      {label}
    </span>
  );
}

/** Editorin yläpalkki: missä olen (sivu), miten katson (laite) ja mitä teen (julkaise). */
export default function EditorTopBar({
  siteId,
  siteLabel,
  siteUrl,
  pageSlug,
  pageTitle,
  device,
  onDeviceChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveStatus,
  lastSavedAt,
  published,
  publishing,
  onPublishChange,
  panelOpen,
  onTogglePanel,
  fullPreview,
  onToggleFullPreview,
  onOpenSettings,
}: {
  siteId: SiteId;
  siteLabel: string;
  siteUrl: string;
  pageSlug: string;
  pageTitle: string;
  device: PreviewDevice;
  onDeviceChange: (device: PreviewDevice) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveStatus: AutosaveStatus;
  lastSavedAt: Date | null;
  published: boolean;
  publishing: boolean;
  onPublishChange: (published: boolean) => void;
  panelOpen: boolean;
  onTogglePanel: () => void;
  fullPreview: boolean;
  onToggleFullPreview: () => void;
  onOpenSettings: () => void;
}) {
  const router = useRouter();
  const pages = useSitePages();
  const pageUrl = pageSlug === "home" ? siteUrl : `${siteUrl}/${pageSlug}`;

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-2 sm:px-3">
      {/* Missä olen */}
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <Link
          href="/app/dashboard"
          aria-label="Takaisin sivustoihin"
          title="Sivustot"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        {!fullPreview && (
          <IconButton label={panelOpen ? "Piilota paneeli" : "Näytä paneeli"} onClick={onTogglePanel} active={panelOpen}>
            <PanelLeft />
          </IconButton>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger className="ml-1 inline-flex min-w-0 items-center gap-1.5 rounded-md px-2 py-1.5 text-left hover:bg-muted">
            <span className="min-w-0">
              <span className="block truncate text-[11px] leading-tight text-muted-foreground">
                {siteLabel}
              </span>
              <span className="block truncate text-sm font-semibold leading-tight">{pageTitle}</span>
            </span>
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-60">
            <DropdownMenuLabel className="text-xs text-muted-foreground">Sivut</DropdownMenuLabel>
            {pages.map((page) => (
              <DropdownMenuItem
                key={page.slug}
                onSelect={() =>
                  router.push(
                    page.slug === "home"
                      ? `/app/dashboard/${siteId}`
                      : `/app/dashboard/${siteId}?page=${encodeURIComponent(page.slug)}`,
                  )
                }
              >
                <FileText className="size-4" aria-hidden />
                <span className="flex-1 truncate">{page.title}</span>
                {page.slug === pageSlug && <Check className="size-4 text-primary" aria-hidden />}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/app/dashboard/${siteId}/pages`}>Hallitse sivuja…</Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Miten katson */}
      <div className="flex items-center gap-1">
        <IconButton label="Kumoa (⌘Z)" onClick={onUndo} disabled={!canUndo}>
          <Undo2 />
        </IconButton>
        <IconButton label="Tee uudelleen (⇧⌘Z)" onClick={onRedo} disabled={!canRedo}>
          <Redo2 />
        </IconButton>
        <span className="mx-1 hidden h-5 w-px bg-border sm:block" aria-hidden />
        <SegmentedControl
          size="sm"
          ariaLabel="Laitekoko"
          value={device}
          onChange={onDeviceChange}
          className="hidden sm:flex"
          options={[
            { value: "desktop", label: <Monitor className="size-4" aria-label="Työpöytä" />, title: "Työpöytä" },
            { value: "tablet", label: <Tablet className="size-4" aria-label="Tabletti" />, title: "Tabletti" },
            { value: "mobile", label: <Smartphone className="size-4" aria-label="Mobiili" />, title: "Mobiili" },
          ]}
        />
      </div>

      {/* Mitä teen */}
      <div className="flex flex-1 items-center justify-end gap-1.5">
        <SaveState status={saveStatus} lastSavedAt={lastSavedAt} />
        <IconButton label="Sivuston asetukset" onClick={onOpenSettings}>
          <Settings />
        </IconButton>
        <IconButton
          label={fullPreview ? "Takaisin muokkaukseen" : "Esikatsele"}
          onClick={onToggleFullPreview}
          active={fullPreview}
        >
          {fullPreview ? <EyeOff /> : <Eye />}
        </IconButton>
        {published ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              disabled={publishing}
              className="inline-flex h-8 items-center gap-1.5 rounded-md bg-success/12 px-3 text-xs font-semibold text-success ring-1 ring-inset ring-success/25 hover:bg-success/20"
            >
              <span className="size-1.5 rounded-full bg-success" aria-hidden />
              Julkaistu
              <ChevronDown className="size-3.5" aria-hidden />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <a href={pageUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="size-4" aria-hidden />
                  Avaa sivu
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onPublishChange(false)}>
                <EyeOff className="size-4" aria-hidden />
                Piilota sivu
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button size="sm" onClick={() => onPublishChange(true)} disabled={publishing}>
            {publishing ? <Loader2 className="animate-spin" aria-hidden /> : <Rocket aria-hidden />}
            Julkaise
          </Button>
        )}
      </div>
    </header>
  );
}
