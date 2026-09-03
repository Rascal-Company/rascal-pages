"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ExternalLink,
  Eye,
  Keyboard,
  Monitor,
  PanelLeftClose,
  PanelLeftOpen,
  Redo2,
  Settings,
  Smartphone,
  Undo2,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import ThemeToggle from "@/app/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import type { SiteId } from "@/src/lib/types";
import type { AutosaveStatus } from "./hooks/useAutosave";
import SaveStatusIndicator from "./SaveStatusIndicator";
import { useSitePages } from "./SitePagesContext";

export type PreviewMode = "desktop" | "mobile";

type EditorTopBarProps = {
  siteId: SiteId;
  pageSlug: string;
  pageTitle: string;
  liveUrl: string;
  published: boolean;
  isPublishing: boolean;
  onTogglePublished: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveStatus: AutosaveStatus;
  lastSavedAt: Date | null;
  isDirty: boolean;
  previewMode: PreviewMode;
  onPreviewModeChange: (mode: PreviewMode) => void;
  isFullPreview: boolean;
  onToggleFullPreview: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
};

function editHref(siteId: SiteId, slug: string): string {
  return slug === "home"
    ? `/app/dashboard/${siteId}`
    : `/app/dashboard/${siteId}?page=${slug}`;
}

/**
 * Single toolbar above sidebar and canvas: navigation and page switching on
 * the left, history and save state in the middle, preview and publishing on
 * the right. Everything that changes the whole page lives here so the sidebar
 * can stay focused on content.
 */
export default function EditorTopBar({
  siteId,
  pageSlug,
  pageTitle,
  liveUrl,
  published,
  isPublishing,
  onTogglePublished,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveStatus,
  lastSavedAt,
  isDirty,
  previewMode,
  onPreviewModeChange,
  isFullPreview,
  onToggleFullPreview,
  isSidebarOpen,
  onToggleSidebar,
  onOpenSettings,
  onOpenHelp,
}: EditorTopBarProps) {
  const router = useRouter();
  const pages = useSitePages();
  const backHref =
    pageSlug === "home" ? "/app/dashboard" : `/app/dashboard/${siteId}/pages`;

  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-card px-2">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          disabled={isFullPreview}
          aria-label={isSidebarOpen ? "Piilota sivupalkki" : "Näytä sivupalkki"}
          title={isSidebarOpen ? "Piilota sivupalkki" : "Näytä sivupalkki"}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground hover:text-foreground"
        >
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4" />
            Takaisin
          </Link>
        </Button>
        <div aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
        <DropdownMenu>
          <DropdownMenuTrigger className="flex min-w-0 items-center gap-1 rounded-md px-2 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="truncate">{pageTitle}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {pages.map((page) => (
              <DropdownMenuItem
                key={page.slug}
                onSelect={() => router.push(editHref(siteId, page.slug))}
                className={
                  page.slug === pageSlug
                    ? "font-semibold text-foreground"
                    : "text-foreground"
                }
              >
                {page.title || page.slug}
              </DropdownMenuItem>
            ))}
            {pages.length > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              onSelect={() => router.push(`/app/dashboard/${siteId}/pages`)}
              className="text-foreground"
            >
              Hallitse sivuja…
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Kumoa"
          title="Kumoa (⌘Z)"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRedo}
          disabled={!canRedo}
          aria-label="Tee uudelleen"
          title="Tee uudelleen (⌘⇧Z)"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <div className="hidden min-w-[11rem] px-2 md:block">
          <SaveStatusIndicator
            status={saveStatus}
            lastSavedAt={lastSavedAt}
            isDirty={isDirty}
          />
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1">
        <div
          role="group"
          aria-label="Esikatselun koko"
          className="flex rounded-md border border-border"
        >
          <button
            type="button"
            onClick={() => onPreviewModeChange("desktop")}
            aria-pressed={previewMode === "desktop"}
            title="Työpöytä"
            className={`rounded-l-md p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              previewMode === "desktop"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onPreviewModeChange("mobile")}
            aria-pressed={previewMode === "mobile"}
            title="Mobiili"
            className={`rounded-r-md border-l border-border p-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              previewMode === "mobile"
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Smartphone className="h-4 w-4" />
          </button>
        </div>
        <Button
          variant={isFullPreview ? "secondary" : "ghost"}
          size="sm"
          onClick={onToggleFullPreview}
          aria-pressed={isFullPreview}
          title={
            isFullPreview ? "Palaa muokkaamaan" : "Esikatsele ilman työkaluja"
          }
        >
          <Eye className="h-4 w-4" />
          {isFullPreview ? "Muokkaa" : "Esikatselu"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenSettings}
          aria-label="Sivuston asetukset"
          title="Sivuston asetukset"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenHelp}
          aria-label="Pikanäppäimet"
          title="Pikanäppäimet (?)"
        >
          <Keyboard className="h-4 w-4" />
        </Button>
        <ThemeToggle />
        <div aria-hidden="true" className="mx-1 h-6 w-px bg-border" />
        <span
          className={`hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex ${
            published
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          }`}
        >
          <span
            aria-hidden="true"
            className={`h-1.5 w-1.5 rounded-full ${
              published ? "bg-emerald-500" : "bg-muted-foreground/60"
            }`}
          />
          {published ? "Julkaistu" : "Luonnos"}
        </span>
        <Button
          size="sm"
          variant={published ? "outline" : "default"}
          onClick={onTogglePublished}
          disabled={isPublishing}
        >
          {isPublishing ? "Odota…" : published ? "Piilota sivu" : "Julkaise"}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          asChild={published}
          disabled={!published}
          aria-label="Avaa julkaistu sivu"
          title={published ? "Avaa julkaistu sivu" : "Julkaise ensin"}
        >
          {published ? (
            <a href={liveUrl} target="_blank" rel="noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          ) : (
            <ExternalLink className="h-4 w-4" />
          )}
        </Button>
      </div>
    </header>
  );
}
