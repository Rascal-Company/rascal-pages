import { describe, expect, it } from "vitest";
import {
  DRAFT_SITE_LIMIT,
  hasFreeRascalSlot,
  allowedTemplateList,
  defaultTemplateIdFor,
  canCreateDraftSite,
  publishBlockReason,
  BASIC_PAGE_LIMIT,
  BASIC_TEMPLATE_IDS,
  PAST_DUE_GRACE_DAYS,
  canPublishAnotherPage,
  isTemplateAllowed,
  rascalQuotaFromProduct,
  resolveEntitlements,
  type RascalPagesQuota,
  type SitePlan,
} from "./entitlements";

const NOW = new Date("2026-11-10T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const RASCAL_480: RascalPagesQuota = { includedSites: 1, maxPages: 25 };
const RASCAL_880: RascalPagesQuota = { includedSites: 3, maxPages: null };

function plan(overrides: Partial<SitePlan> = {}): SitePlan {
  return { tier: "draft", billingStatus: "none", pastDueSince: null, ...overrides };
}

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY_MS);
}

describe("rascalQuotaFromProduct", () => {
  it("palauttaa null ilman riviä", () => {
    expect(rascalQuotaFromProduct(null)).toBeNull();
  });

  it("palauttaa null kun moduuli ei ole käytössä", () => {
    expect(rascalQuotaFromProduct({ is_enabled: false, plan_tier: "pro", settings: {} })).toBeNull();
  });

  it("trial ei anna Rascal-oikeuksia", () => {
    expect(
      rascalQuotaFromProduct({ is_enabled: true, plan_tier: "trial", settings: { included_sites: 3 } }),
    ).toBeNull();
  });

  it("lukee kiintiöt settingsistä", () => {
    expect(
      rascalQuotaFromProduct({
        is_enabled: true,
        plan_tier: "pro",
        settings: { included_sites: 3, max_pages: null },
      }),
    ).toEqual(RASCAL_880);
  });

  it("käyttää oletuksia puuttuville tai virheellisille arvoille", () => {
    expect(rascalQuotaFromProduct({ is_enabled: true, plan_tier: "pro", settings: null })).toEqual(RASCAL_480);
    expect(
      rascalQuotaFromProduct({
        is_enabled: true,
        plan_tier: "pro",
        settings: { included_sites: "3", max_pages: -1 },
      }),
    ).toEqual(RASCAL_480);
  });
});

describe("resolveEntitlements: julkaisuoikeus", () => {
  it.each([
    ["draft ilman Rascalia", plan(), null, false],
    ["draft Rascal-orgissa", plan(), RASCAL_480, false],
    ["basic aktiivinen", plan({ tier: "basic", billingStatus: "active" }), null, true],
    ["basic peruttu", plan({ tier: "basic", billingStatus: "canceled" }), null, false],
    ["basic pysyvästi ilmainen (comped)", plan({ tier: "basic", billingStatus: "comped" }), null, true],
    ["draft comped ei silti julkaise", plan({ tier: "draft", billingStatus: "comped" }), null, false],
    ["basic ilman laskutusta", plan({ tier: "basic", billingStatus: "none" }), null, false],
    ["rascal-paikka Rascal-orgissa", plan({ tier: "rascal" }), RASCAL_480, true],
    ["rascal-paikka kun Rascal päättyi", plan({ tier: "rascal" }), null, false],
  ] as const)("%s → canPublish %s", (_label, sitePlan, rascal, expected) => {
    expect(resolveEntitlements({ sitePlan, rascal, now: NOW }).canPublish).toBe(expected);
  });

  it("past_due on julkaistavissa armonajan sisällä", () => {
    const sitePlan = plan({ tier: "basic", billingStatus: "past_due", pastDueSince: daysAgo(PAST_DUE_GRACE_DAYS - 1) });
    expect(resolveEntitlements({ sitePlan, rascal: null, now: NOW }).canPublish).toBe(true);
  });

  it("past_due piilottaa sivuston armonajan jälkeen", () => {
    const sitePlan = plan({ tier: "basic", billingStatus: "past_due", pastDueSince: daysAgo(PAST_DUE_GRACE_DAYS) });
    expect(resolveEntitlements({ sitePlan, rascal: null, now: NOW }).canPublish).toBe(false);
  });

  it("past_due ilman alkuhetkeä ei ole julkaistavissa", () => {
    const sitePlan = plan({ tier: "basic", billingStatus: "past_due", pastDueSince: null });
    expect(resolveEntitlements({ sitePlan, rascal: null, now: NOW }).canPublish).toBe(false);
  });
});

describe("resolveEntitlements: ominaisuudet", () => {
  it("Basic: vain portfolio-pohjat, 5 sivua, badge, ei overlayta", () => {
    const e = resolveEntitlements({ sitePlan: plan({ tier: "basic", billingStatus: "active" }), rascal: null, now: NOW });
    expect(e.allowedTemplateIds).toBe(BASIC_TEMPLATE_IDS);
    expect(e.maxPublishedPages).toBe(BASIC_PAGE_LIMIT);
    expect(e.overlays).toBe(false);
    expect(e.showBadge).toBe(true);
    expect(e.customDomain).toBe(true);
  });

  it("Rascal 480: kaikki pohjat, 25 sivua, ei badgea", () => {
    const e = resolveEntitlements({ sitePlan: plan({ tier: "rascal" }), rascal: RASCAL_480, now: NOW });
    expect(e.allowedTemplateIds).toBe("all");
    expect(e.maxPublishedPages).toBe(25);
    expect(e.overlays).toBe(true);
    expect(e.showBadge).toBe(false);
  });

  it("Rascal 880: rajaton sivumäärä", () => {
    const e = resolveEntitlements({ sitePlan: plan({ tier: "rascal" }), rascal: RASCAL_880, now: NOW });
    expect(e.maxPublishedPages).toBeNull();
  });

  it("Rascal-orgin maksettu lisäsivusto perii Rascal-ominaisuudet", () => {
    const e = resolveEntitlements({
      sitePlan: plan({ tier: "basic", billingStatus: "active" }),
      rascal: RASCAL_480,
      now: NOW,
    });
    expect(e.canPublish).toBe(true);
    expect(e.allowedTemplateIds).toBe("all");
    expect(e.overlays).toBe(true);
    expect(e.maxPublishedPages).toBe(25);
  });

  it("luonnoksella ei omaa domainia, mutta pohjat näkyvät orgin paketin mukaan", () => {
    const e = resolveEntitlements({ sitePlan: plan(), rascal: RASCAL_480, now: NOW });
    expect(e.customDomain).toBe(false);
    expect(e.allowedTemplateIds).toBe("all");
  });
});

describe("isTemplateAllowed", () => {
  const basic = resolveEntitlements({ sitePlan: plan(), rascal: null, now: NOW });
  const rascal = resolveEntitlements({ sitePlan: plan({ tier: "rascal" }), rascal: RASCAL_480, now: NOW });

  it.each(["portfolio", "personal", "personal-brand", "blank"])("Basic sallii %s", (id) => {
    expect(isTemplateAllowed(basic, id)).toBe(true);
  });

  it.each(["lead-magnet", "waitlist", "saas-modern", "vsl", "mobile-app"])("Basic lukitsee landerin %s", (id) => {
    expect(isTemplateAllowed(basic, id)).toBe(false);
  });

  it("Rascal sallii landerit", () => {
    expect(isTemplateAllowed(rascal, "lead-magnet")).toBe(true);
  });
});

describe("canPublishAnotherPage", () => {
  const basic = resolveEntitlements({ sitePlan: plan({ tier: "basic", billingStatus: "active" }), rascal: null, now: NOW });
  const unlimited = resolveEntitlements({ sitePlan: plan({ tier: "rascal" }), rascal: RASCAL_880, now: NOW });

  it("sallii kunnes raja täyttyy", () => {
    expect(canPublishAnotherPage(basic, BASIC_PAGE_LIMIT - 1)).toBe(true);
    expect(canPublishAnotherPage(basic, BASIC_PAGE_LIMIT)).toBe(false);
  });

  it("rajaton sallii aina", () => {
    expect(canPublishAnotherPage(unlimited, 1000)).toBe(true);
  });
});

describe("publishBlockReason", () => {
  const draft = resolveEntitlements({ sitePlan: plan(), rascal: null, now: NOW });
  const basic = resolveEntitlements({ sitePlan: plan({ tier: "basic", billingStatus: "active" }), rascal: null, now: NOW });
  const rascal = resolveEntitlements({ sitePlan: plan({ tier: "rascal" }), rascal: RASCAL_480, now: NOW });

  it("luonnos vaatii maksun", () => {
    expect(publishBlockReason({ entitlements: draft, templateId: "portfolio", publishedCount: 0 })).toBe("PAYMENT_REQUIRED");
  });

  it("Basic ei julkaise landeria", () => {
    expect(publishBlockReason({ entitlements: basic, templateId: "lead-magnet", publishedCount: 0 })).toBe("UPGRADE_REQUIRED");
  });

  it("Basic-sivuraja", () => {
    expect(publishBlockReason({ entitlements: basic, templateId: "portfolio", publishedCount: BASIC_PAGE_LIMIT })).toBe("PAGE_LIMIT");
  });

  it("sallii kun kaikki kunnossa, myös ilman templateId:tä", () => {
    expect(publishBlockReason({ entitlements: basic, templateId: null, publishedCount: 0 })).toBeNull();
    expect(publishBlockReason({ entitlements: rascal, templateId: "lead-magnet", publishedCount: 10 })).toBeNull();
  });
});

describe("canCreateDraftSite", () => {
  it("sallii rajaan asti", () => {
    expect(canCreateDraftSite(DRAFT_SITE_LIMIT - 1)).toBe(true);
    expect(canCreateDraftSite(DRAFT_SITE_LIMIT)).toBe(false);
  });
});

describe("defaultTemplateIdFor / allowedTemplateList", () => {
  const basic = resolveEntitlements({ sitePlan: plan(), rascal: null, now: NOW });
  const rascal = resolveEntitlements({ sitePlan: plan({ tier: "rascal" }), rascal: RASCAL_480, now: NOW });

  it("Basicin oletuspohja on portfolio", () => {
    expect(defaultTemplateIdFor(basic, "saas-modern")).toBe("portfolio");
  });

  it("Rascal pitää toivotun oletuspohjan", () => {
    expect(defaultTemplateIdFor(rascal, "saas-modern")).toBe("saas-modern");
  });

  it("lista: null kun kaikki sallittu", () => {
    expect(allowedTemplateList(rascal)).toBeNull();
    expect(allowedTemplateList(basic)).toEqual([...BASIC_TEMPLATE_IDS]);
  });
});

describe("hasFreeRascalSlot", () => {
  it("ei paikkoja ilman Rascalia", () => {
    expect(hasFreeRascalSlot(null, 0)).toBe(false);
  });

  it("vapaa paikka kunnes sisältyvät käytetty", () => {
    expect(hasFreeRascalSlot(RASCAL_880, 2)).toBe(true);
    expect(hasFreeRascalSlot(RASCAL_880, 3)).toBe(false);
    expect(hasFreeRascalSlot(RASCAL_480, 1)).toBe(false);
  });
});
