import Stripe from "stripe";

/**
 * Stripe-asiakas palvelimelle (RAS-1170). Vain server actioneissa ja
 * webhookissa; avain ei koskaan päädy selaimeen.
 */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe vaatii STRIPE_SECRET_KEY-ympäristömuuttujan");
  return new Stripe(key);
}

/** Tilauksen nykyisen jakson loppu (sekunteina); API:ssa jakso on tilausrivillä. */
export function subscriptionPeriodEnd(subscription: Stripe.Subscription): number | null {
  return subscription.items.data[0]?.current_period_end ?? null;
}

export function stripeId(value: string | { id: string } | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.id;
}
