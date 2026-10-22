import { describe, expect, it } from "vitest";
import { siteKind } from "./site-kind";

describe("siteKind", () => {
  it("overlay: ei etusivua mutta kampanjoita", () => {
    expect(siteKind({ hasHomePage: false, templateId: null, campaignCount: 2, postCount: 0 })).toBe("overlay");
  });

  it("etusivullinen sivusto on lander, vaikka sillä olisi kampanjoita", () => {
    expect(siteKind({ hasHomePage: true, templateId: "saas-modern", campaignCount: 1, postCount: 0 })).toBe("lander");
  });

  it("henkilösivupohjat ovat portfolioita", () => {
    for (const templateId of ["portfolio", "personal", "personal-brand"]) {
      expect(siteKind({ hasHomePage: true, templateId, campaignCount: 0, postCount: 0 })).toBe(
        "portfolio",
      );
    }
  });

  it("uusi sivusto ilman sivua tai kampanjoita on lander", () => {
    expect(siteKind({ hasHomePage: false, templateId: null, campaignCount: 0, postCount: 0 })).toBe(
      "lander",
    );
  });

  it("blogillinen sivusto on portfolio pohjasta riippumatta", () => {
    expect(siteKind({ hasHomePage: true, templateId: "saas-modern", campaignCount: 0, postCount: 3 })).toBe(
      "portfolio",
    );
  });
});
