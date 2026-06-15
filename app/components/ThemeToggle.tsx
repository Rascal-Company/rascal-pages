"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useDashboardTheme } from "@/app/components/providers/DashboardThemeProvider";

export default function ThemeToggle() {
  const { theme, toggle } = useDashboardTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label="Vaihda vaalea/tumma teema"
      title={theme === "dark" ? "Vaalea teema" : "Tumma teema"}
    >
      {theme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
