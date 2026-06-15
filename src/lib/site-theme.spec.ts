import { describe, expect, test } from "vitest";
import type { ThemeConfig } from "./templates";
import { DEFAULT_PRIMARY, buildSiteThemeVars } from "./site-theme";

const lightTheme: ThemeConfig = { primaryColor: "#3B82F6" };

describe(buildSiteThemeVars, () => {
  test("derives a full light token set from just a primary color", () => {
    expect(buildSiteThemeVars(lightTheme)).toEqual({
      "--primary": "#3B82F6",
      "--primary-foreground": "#ffffff",
      "--background": "#ffffff",
      "--foreground": "#111827",
      "--muted": "#f3f4f6",
      "--muted-foreground": "#6b7280",
      "--card": "#f9fafb",
      "--card-foreground": "#111827",
      "--border": "#e5e7eb",
    });
  });

  test("uses the dark base surfaces when appearance is dark", () => {
    const vars = buildSiteThemeVars({ primaryColor: "#6366F1", appearance: "dark" });
    expect([vars["--background"], vars["--foreground"], vars["--border"]]).toEqual([
      "#0a0a0b",
      "#f5f5f7",
      "#232327",
    ]);
  });

  test("explicit palette values override the appearance base", () => {
    const vars = buildSiteThemeVars({
      primaryColor: "#3B82F6",
      palette: { primary: "#FF0000", background: "#000000", foreground: "#eeeeee" },
    });
    expect([vars["--primary"], vars["--background"], vars["--foreground"]]).toEqual([
      "#FF0000",
      "#000000",
      "#eeeeee",
    ]);
  });

  test("falls back to the default primary when none is provided", () => {
    expect(
      buildSiteThemeVars({ primaryColor: "" as unknown as string })["--primary"],
    ).toBe(DEFAULT_PRIMARY);
  });

  test("only emits --radius when the theme sets one", () => {
    expect("--radius" in buildSiteThemeVars(lightTheme)).toBe(false);
    expect(buildSiteThemeVars({ ...lightTheme, radius: "0.75rem" })["--radius"]).toBe(
      "0.75rem",
    );
  });
});
