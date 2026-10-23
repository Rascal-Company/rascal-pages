/**
 * Tuotteen käyttöoikeus organisaatiolle get_org_products-RPC:n riveistä
 * (sama funktio kuin Rascal AI:ssa ja @rascal/authissa). RPC laskee
 * has_access-kentän: tuote päällä, kokeilu voimassa ja jäsenen tuoterajaus.
 */
export const PAGES_PRODUCT_SLUG = "rascal-pages";

export type OrgProductRow = {
  product_slug: string;
  is_enabled: boolean;
  plan_tier: string | null;
  trial_ends_at: string | null;
  has_access: boolean;
};

export type ProductAccess = {
  hasAccess: boolean;
  /** Tuote oli kokeilussa ja kokeilu on päättynyt (eri viesti käyttäjälle). */
  trialExpired: boolean;
};

export function productAccess(
  rows: OrgProductRow[] | null | undefined,
  slug: string,
  now: Date = new Date(),
): ProductAccess {
  const row = (rows ?? []).find((r) => r.product_slug === slug);
  if (!row) return { hasAccess: false, trialExpired: false };
  const trialExpired =
    row.is_enabled &&
    row.plan_tier === "trial" &&
    row.trial_ends_at !== null &&
    new Date(row.trial_ends_at) < now;
  return { hasAccess: row.has_access === true, trialExpired };
}
