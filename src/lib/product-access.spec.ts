import { describe, expect, it } from "vitest";
import { productAccess, type OrgProductRow } from "./product-access";

const row = (overrides: Partial<OrgProductRow> = {}): OrgProductRow => ({
  product_slug: "rascal-pages",
  is_enabled: true,
  plan_tier: "pro",
  trial_ends_at: null,
  has_access: true,
  ...overrides,
});

describe("productAccess", () => {
  it("käyttää RPC:n has_access-tietoa", () => {
    expect(productAccess([row()], "rascal-pages")).toEqual({ hasAccess: true, trialExpired: false });
    expect(productAccess([row({ has_access: false, is_enabled: false })], "rascal-pages").hasAccess).toBe(false);
  });

  it("ei pääsyä, jos tuotetta ei ole listalla tai lista puuttuu", () => {
    expect(productAccess([row({ product_slug: "rascal-ai" })], "rascal-pages").hasAccess).toBe(false);
    expect(productAccess(null, "rascal-pages").hasAccess).toBe(false);
  });

  it("tunnistaa päättyneen kokeilun", () => {
    const expired = row({ plan_tier: "trial", trial_ends_at: "2026-01-01T00:00:00Z", has_access: false });
    expect(productAccess([expired], "rascal-pages", new Date("2026-10-22"))).toEqual({
      hasAccess: false,
      trialExpired: true,
    });
  });
});
