import { describe, expect, it } from "vitest";
import {
  billingStatusFromStripe,
  sitePlanLabel,
  parseBillingInterval,
  sitePlanFromSubscription,
  stripePriceId,
} from "./billing";

const NOW = new Date("2026-11-10T12:00:00Z");

describe("billingStatusFromStripe", () => {
  it.each([
    ["active", "active"],
    ["trialing", "active"],
    ["past_due", "past_due"],
    ["unpaid", "past_due"],
    ["canceled", "canceled"],
    ["incomplete_expired", "canceled"],
    ["paused", "canceled"],
    ["incomplete", "none"],
    ["jotain_uutta", "none"],
  ])("%s → %s", (stripe, expected) => {
    expect(billingStatusFromStripe(stripe)).toBe(expected);
  });
});

describe("sitePlanFromSubscription", () => {
  const base = {
    subscriptionId: "sub_1",
    customerId: "cus_1",
    currentPeriodEnd: 1_800_000_000,
    previousPastDueSince: null,
    now: NOW,
  };

  it("aktiivinen tilaus: basic, jakson loppu ISO-aikana, ei past_due-aikaa", () => {
    expect(sitePlanFromSubscription({ ...base, status: "active" })).toEqual({
      tier: "basic",
      billing_status: "active",
      stripe_customer_id: "cus_1",
      stripe_subscription_id: "sub_1",
      current_period_end: new Date(1_800_000_000 * 1000).toISOString(),
      past_due_since: null,
      updated_at: NOW.toISOString(),
    });
  });

  it("ensimmäinen epäonnistunut maksu aloittaa armonajan nyt", () => {
    expect(sitePlanFromSubscription({ ...base, status: "past_due" }).past_due_since).toBe(NOW.toISOString());
  });

  it("uudelleenyritys ei nollaa armonaikaa", () => {
    const since = "2026-11-05T08:00:00.000Z";
    expect(
      sitePlanFromSubscription({ ...base, status: "past_due", previousPastDueSince: since }).past_due_since,
    ).toBe(since);
  });

  it("maksun onnistuminen tyhjentää armonajan", () => {
    expect(
      sitePlanFromSubscription({ ...base, status: "active", previousPastDueSince: "2026-11-05T08:00:00.000Z" })
        .past_due_since,
    ).toBeNull();
  });

  it("puuttuva jakson loppu → null", () => {
    expect(sitePlanFromSubscription({ ...base, status: "active", currentPeriodEnd: null }).current_period_end).toBeNull();
  });
});

describe("parseBillingInterval", () => {
  it("hyväksyy month ja year", () => {
    expect(parseBillingInterval("month")).toBe("month");
    expect(parseBillingInterval("year")).toBe("year");
  });

  it.each([undefined, "", "week", 1])("hylkää %j", (raw) => {
    expect(parseBillingInterval(raw)).toBeNull();
  });
});

describe("stripePriceId", () => {
  const env = { STRIPE_PRICE_BASIC_MONTHLY: "price_m", STRIPE_PRICE_BASIC_YEARLY: "price_y" };

  it("valitsee hinnan laskutusvälin mukaan", () => {
    expect(stripePriceId("month", env)).toBe("price_m");
    expect(stripePriceId("year", env)).toBe("price_y");
  });

  it("null jos hintaa ei ole asetettu", () => {
    expect(stripePriceId("year", {})).toBeNull();
  });
});

describe("sitePlanLabel", () => {
  it.each([
    ["rascal", "none", "Sisältyy Rascal-pakettiin"],
    ["draft", "none", "Ei julkaistu"],
    ["basic", "comped", "Basic, maksuton"],
    ["basic", "active", "Basic, 19 €/kk"],
    ["basic", "past_due", "Basic, maksu epäonnistui"],
    ["basic", "canceled", "Basic, tilaus päättynyt"],
    ["basic", "none", "Basic, maksu kesken"],
  ] as const)("%s/%s → %s", (tier, status, label) => {
    expect(sitePlanLabel(tier, status)).toBe(label);
  });
});
