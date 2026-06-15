"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import ThemeToggle from "@/app/components/ThemeToggle";

interface EditorHeaderProps {
  siteSubdomain: string;
  onSettingsClick: () => void;
}

export default function EditorHeader({
  siteSubdomain,
  onSettingsClick,
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
        </div>
      </div>
      <p className="mt-1 truncate text-xs text-muted-foreground">
        {siteSubdomain}.rascalpages.fi
      </p>
    </div>
  );
}
