"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import ThemeToggle from "@/app/components/ThemeToggle";

interface EditorHeaderProps {
  siteSubdomain: string;
  onSettingsClick: () => void;
  onHideSidebar: () => void;
}

export default function EditorHeader({
  siteSubdomain,
  onSettingsClick,
  onHideSidebar,
}: EditorHeaderProps) {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/app/dashboard")}
          className="-ml-2 h-auto px-2 text-muted-foreground hover:text-foreground"
        >
          ← Takaisin
        </Button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={onSettingsClick}>
            Asetukset
          </Button>
          <button
            type="button"
            onClick={onHideSidebar}
            title="Piilota sivupalkki"
            aria-label="Piilota sivupalkki"
            className="flex h-9 w-9 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 19l-7-7 7-7M18 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {siteSubdomain}.rascalpages.fi
      </p>
    </div>
  );
}
