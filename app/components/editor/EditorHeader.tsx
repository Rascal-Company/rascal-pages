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
    <div className="mb-6">
      <div className="flex items-center justify-between">
        <Button
          variant="link"
          size="sm"
          onClick={() => router.push("/app/dashboard")}
          className="h-auto px-0 text-muted-foreground hover:text-foreground"
        >
          ← Takaisin dashboardiin
        </Button>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button variant="outline" size="sm" onClick={onSettingsClick}>
            Asetukset
          </Button>
        </div>
      </div>
      <h1 className="mt-4 text-2xl font-bold text-foreground">
        Muokkaa sivustoa
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {siteSubdomain}.rascalpages.fi
      </p>
    </div>
  );
}
