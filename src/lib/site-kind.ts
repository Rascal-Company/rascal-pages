/**
 * Dashboardin ryhmittely: laskeutumissivut, henkilö- ja portfoliosivut
 * (myös blogilliset kokonaiset sivustot) sekä overlay-sivustot (asiakkaan
 * oma sivu, ei Pages-etusivua).
 */
export const SITE_KINDS = ["lander", "portfolio", "overlay"] as const;
export type SiteKind = (typeof SITE_KINDS)[number];

const PORTFOLIO_TEMPLATES = new Set(["portfolio", "personal", "personal-brand"]);

export function siteKind(input: {
  hasHomePage: boolean;
  templateId: string | null;
  campaignCount: number;
  postCount: number;
}): SiteKind {
  if (!input.hasHomePage && input.campaignCount > 0) return "overlay";
  if (input.templateId && PORTFOLIO_TEMPLATES.has(input.templateId)) return "portfolio";
  if (input.postCount > 0) return "portfolio";
  return "lander";
}
