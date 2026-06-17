"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "rascal-pages-theme";

type ThemeContextValue = {
  theme: Theme;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(STORAGE_KEY) === "dark" ? "dark" : "light";
}

/**
 * Dashboard-scoped theme. Toggles a `dark` class on a wrapper that sits ONLY
 * around the /app dashboard subtree, so published user sites (rendered under a
 * different route subtree) are never affected. The preference persists in
 * localStorage and is read during the initial client render;
 * `suppressHydrationWarning` covers the light→stored class swap on the wrapper.
 */
export function DashboardThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  const toggle = () =>
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      window.localStorage.setItem(STORAGE_KEY, next);
      return next;
    });

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      <div
        className={theme === "dark" ? "dark" : undefined}
        suppressHydrationWarning
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useDashboardTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error(
      "useDashboardTheme must be used within a DashboardThemeProvider",
    );
  }
  return ctx;
}
