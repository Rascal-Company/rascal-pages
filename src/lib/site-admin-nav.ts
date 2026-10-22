/**
 * Sivuston yhteinen navigaatio: editori, sivut, blogi, analytiikka ja
 * asetukset (overlay-sivustolla kampanjat). Sama lista näkyy editorin
 * yläpalkissa ja jokaisella sivuston hallintasivulla.
 */
export type SiteAdminNavKind = "pages" | "overlay";
export type SiteAdminNavKey = "editor" | "pages" | "posts" | "overlay" | "analytics" | "settings";
export type SiteAdminNavItem = { key: SiteAdminNavKey; label: string; href: string };

export function siteAdminNavItems(siteId: string, kind: SiteAdminNavKind): SiteAdminNavItem[] {
  const base = `/app/dashboard/${siteId}`;
  const analytics: SiteAdminNavItem = { key: "analytics", label: "Analytiikka", href: `${base}/analytics` };
  const settings: SiteAdminNavItem = { key: "settings", label: "Asetukset", href: `${base}/settings` };
  if (kind === "overlay") {
    return [{ key: "overlay", label: "Kampanjat", href: `${base}/overlay` }, analytics, settings];
  }
  return [
    { key: "editor", label: "Editori", href: base },
    { key: "pages", label: "Sivut", href: `${base}/pages` },
    { key: "posts", label: "Blogi", href: `${base}/posts` },
    analytics,
    settings,
  ];
}

/** Aktiivinen kohta polusta; null, jos polku ei kuulu sivustolle. */
export function activeSiteAdminNavKey(pathname: string, siteId: string): SiteAdminNavKey | null {
  const base = `/app/dashboard/${siteId}`;
  if (pathname === base || pathname === `${base}/`) return "editor";
  if (!pathname.startsWith(`${base}/`)) return null;
  const segment = pathname.slice(base.length + 1).split("/")[0];
  const keys: SiteAdminNavKey[] = ["pages", "posts", "overlay", "analytics", "settings"];
  return keys.find((key) => key === segment) ?? null;
}

/**
 * Overlay-sivusto on asiakkaan oma sivu ilman Pages-etusivua (sama sääntö
 * kuin dashboardin ryhmittelyssä, ks. site-kind.ts).
 */
export function siteAdminNavKind(input: { hasHomePage: boolean; campaignCount: number }): SiteAdminNavKind {
  return !input.hasHomePage && input.campaignCount > 0 ? "overlay" : "pages";
}

/** Näkymät, jotka avautuvat editorin päälle ikkunana (Pages-sivustolla). */
export const SITE_MODAL_KEYS = ["pages", "posts", "analytics", "settings"] as const;
export type SiteModalKey = (typeof SITE_MODAL_KEYS)[number];

export function isSiteModalKey(value: string | null | undefined): value is SiteModalKey {
  return SITE_MODAL_KEYS.includes(value as SiteModalKey);
}
