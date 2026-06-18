"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import ThemeToggle from "@/app/components/ThemeToggle";
import type { SiteId } from "@/src/lib/types";

interface EditorHeaderProps {
  siteSubdomain: string;
  pageTitle?: string;
  pageSlug?: string;
  siteId?: SiteId;
  onSettingsClick: () => void;
  onHideSidebar: () => void;
}

export default function EditorHeader({
  siteSubdomain,
  pageTitle,
  pageSlug = "home",
  siteId,
  onSettingsClick,
  onHideSidebar,
}: EditorHeaderProps) {
  const router = useRouter();
  const backHref =
    pageSlug === "home" || !siteId
      ? "/app/dashboard"
      : `/app/dashboard/${siteId}/pages`;

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(backHref)}
          className="-ml-2 h-auto px-2 text-muted-foreground hover:text-foreground"
        >
          ← Takaisin
        </Button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={onSettingsClick}>
            Asetukset
          </Button>
          <div aria-hidden="true" className="mx-0.5 h-6 w-px bg-border" />
          <button
            type="button"
            onClick={onHideSidebar}
            title="Piilota sivupalkki"
            aria-label="Piilota sivupalkki"
            className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 4v16M16 9l-3 3 3 3"
              />
            </svg>
          </button>
        </div>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {siteSubdomain}.rascalpages.fi
        {pageTitle ? ` · ${pageTitle}` : ""}
      </p>
    </div>
  );
}
