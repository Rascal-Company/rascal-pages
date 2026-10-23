import { describe, expect, it } from "vitest";
import { activeSiteAdminNavKey, isSiteModalKey, siteAdminNavItems, siteAdminNavKind } from "./site-admin-nav";

describe("siteAdminNavItems", () => {
  it("Pages-sivustolla editori, sivut, blogi, analytiikka ja asetukset", () => {
    expect(siteAdminNavItems("s1", "pages").map((i) => [i.label, i.href])).toEqual([
      ["Editori", "/app/dashboard/s1"],
      ["Sivut", "/app/dashboard/s1/pages"],
      ["Blogi", "/app/dashboard/s1/posts"],
      ["Analytiikka", "/app/dashboard/s1/analytics"],
      ["Asetukset", "/app/dashboard/s1/settings"],
    ]);
  });

  it("overlay-sivustolla kampanjat eikä editoria", () => {
    expect(siteAdminNavItems("s1", "overlay").map((i) => i.key)).toEqual(["overlay", "analytics", "settings"]);
  });
});

describe("activeSiteAdminNavKey", () => {
  it("tunnistaa kohdan polusta", () => {
    expect(activeSiteAdminNavKey("/app/dashboard/s1", "s1")).toBe("editor");
    expect(activeSiteAdminNavKey("/app/dashboard/s1/posts", "s1")).toBe("posts");
    expect(activeSiteAdminNavKey("/app/dashboard/s1/overlay/c1", "s1")).toBe("overlay");
    expect(activeSiteAdminNavKey("/app/dashboard/s10/posts", "s1")).toBeNull();
    expect(activeSiteAdminNavKey("/app/dashboard/s1/tuntematon", "s1")).toBeNull();
  });
});

describe("siteAdminNavKind", () => {
  it("overlay vain ilman etusivua ja kampanjoiden kanssa", () => {
    expect(siteAdminNavKind({ hasHomePage: false, campaignCount: 2 })).toBe("overlay");
    expect(siteAdminNavKind({ hasHomePage: true, campaignCount: 2 })).toBe("pages");
    expect(siteAdminNavKind({ hasHomePage: false, campaignCount: 0 })).toBe("pages");
  });
});

describe("isSiteModalKey", () => {
  it("hyväksyy vain ikkunana avautuvat näkymät", () => {
    expect(isSiteModalKey("posts")).toBe(true);
    expect(isSiteModalKey("editor")).toBe(false);
    expect(isSiteModalKey(null)).toBe(false);
  });
});
