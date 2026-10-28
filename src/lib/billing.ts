import type { SiteBillingStatus } from "@/src/lib/entitlements";

/**
 * Stripe-tilauksen tilan muunto site_plans-riviksi (RAS-1170). Puhdas, jotta
 * webhookin logiikka on testattavissa ilman Stripeä.
 */

export type BillingInterval = "month" | "year";

/** Stripen subscription.status → oma laskutustila. */
export function billingStatusFromStripe(status: string): SiteBillingStatus {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "past_due":
    case "unpaid":
      return "past_due";
    case "canceled":
    case "incomplete_expired":
    case "paused":
      return "canceled";
    default:
      // incomplete: ensimmäinen maksu kesken, ei vielä julkaistavissa.
      return "none";
  }
}

export type SitePlanBillingUpdate = {
  tier: "basic";
  billing_status: SiteBillingStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string;
  current_period_end: string | null;
  past_due_since: string | null;
  updated_at: string;
};

/**
 * Uusi site_plans-tila tilauksesta. `past_due_since` säilyy ensimmäisestä
 * epäonnistuneesta maksusta, jotta 7 päivän armonaika ei ala alusta joka
 * uudelleenyrityksellä.
 */
export function sitePlanFromSubscription(input: {
  status: string;
  subscriptionId: string;
  customerId: string | null;
  currentPeriodEnd: number | null;
  previousPastDueSince: string | null;
  now: Date;
}): SitePlanBillingUpdate {
  const billingStatus = billingStatusFromStripe(input.status);
  return {
    tier: "basic",
    billing_status: billingStatus,
    stripe_customer_id: input.customerId,
    stripe_subscription_id: input.subscriptionId,
    current_period_end: input.currentPeriodEnd ? new Date(input.currentPeriodEnd * 1000).toISOString() : null,
    past_due_since:
      billingStatus === "past_due" ? (input.previousPastDueSince ?? input.now.toISOString()) : null,
    updated_at: input.now.toISOString(),
  };
}

/** Asetusten "Tilaus"-osion teksti sivuston paketista. */
export function sitePlanLabel(tier: string, billingStatus: SiteBillingStatus): string {
  if (tier === "rascal") return "Sisältyy Rascal-pakettiin";
  if (tier === "draft") return "Ei julkaistu";
  switch (billingStatus) {
    case "comped":
      return "Basic, maksuton";
    case "active":
      return "Basic, 19 €/kk";
    case "past_due":
      return "Basic, maksu epäonnistui";
    case "canceled":
      return "Basic, tilaus päättynyt";
    default:
      return "Basic, maksu kesken";
  }
}

export function parseBillingInterval(raw: unknown): BillingInterval | null {
  return raw === "month" || raw === "year" ? raw : null;
}

/** Stripe-hinnan ID env-muuttujasta laskutusvälin mukaan. */
export function stripePriceId(interval: BillingInterval, env: Record<string, string | undefined>): string | null {
  const id = interval === "year" ? env.STRIPE_PRICE_BASIC_YEARLY : env.STRIPE_PRICE_BASIC_MONTHLY;
  return id || null;
}
