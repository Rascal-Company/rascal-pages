import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { isValidUuid } from "@/src/lib/types";
import { getStripe, stripeId, subscriptionPeriodEnd } from "@/src/lib/stripe";
import { sitePlanFromSubscription } from "@/src/lib/billing";

/**
 * Stripe-webhook (RAS-1170): pitää site_plans-rivin tilauksen tilassa.
 * Tilaus haetaan aina Stripestä ja synkataan kokonaisuutena, joten
 * tapahtumien järjestys tai toisto ei haittaa (idempotentti upsert).
 */

async function syncSubscription(stripe: Stripe, subscriptionId: string): Promise<void> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const siteId = subscription.metadata.site_id;
  if (!siteId || !isValidUuid(siteId)) {
    console.warn("Stripe-tilaukselta puuttuu site_id:", subscription.id);
    return;
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("site_plans")
    .select("past_due_since")
    .eq("site_id", siteId)
    .maybeSingle();

  const update = sitePlanFromSubscription({
    status: subscription.status,
    subscriptionId: subscription.id,
    customerId: stripeId(subscription.customer),
    currentPeriodEnd: subscriptionPeriodEnd(subscription),
    previousPastDueSince: (existing?.past_due_since as string | null) ?? null,
    now: new Date(),
  });

  const { error } = await admin.from("site_plans").upsert({ site_id: siteId, ...update }, { onConflict: "site_id" });
  if (error) throw error;
}

function subscriptionIdOf(event: Stripe.Event): string | null {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      return session.mode === "subscription" ? stripeId(session.subscription) : null;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      return event.data.object.id;
    case "invoice.paid":
    case "invoice.payment_failed":
      return stripeId(event.data.object.parent?.subscription_details?.subscription);
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = req.headers.get("stripe-signature");
  if (!secret || !signature) {
    return NextResponse.json({ error: "Webhook ei ole konfiguroitu." }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await req.text(), signature, secret);
  } catch (error) {
    console.error("Stripe-webhookin allekirjoitus ei kelpaa:", error);
    return NextResponse.json({ error: "Virheellinen allekirjoitus." }, { status: 400 });
  }

  const subscriptionId = subscriptionIdOf(event);
  if (!subscriptionId) return NextResponse.json({ received: true });

  try {
    await syncSubscription(stripe, subscriptionId);
  } catch (error) {
    // 500 → Stripe yrittää uudelleen.
    console.error("Stripe-tilauksen synkkaus epäonnistui:", event.type, error);
    return NextResponse.json({ error: "Synkkaus epäonnistui." }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
