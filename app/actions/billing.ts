"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/src/utils/supabase/server";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { getAppUrl } from "@/app/lib/navigation";
import { hasFreeRascalSlot } from "@/src/lib/entitlements";
import { loadOrgRascalQuota } from "@/src/lib/site-plan-server";
import { parseBillingInterval, stripePriceId } from "@/src/lib/billing";
import { getStripe } from "@/src/lib/stripe";
import { normalizeEmail } from "@/src/lib/waitlist";

/**
 * Sivuston julkaisun maksaminen (RAS-1170 + RAS-1171). Rascal-organisaatio
 * käyttää ensin paketin sisältyvät sivustopaikat; muuten Stripe Checkout
 * (19 €/kk tai 190 €/v per sivusto).
 */

export type PublishFlowResult =
  | { status: "activated" }
  | { status: "checkout"; url: string }
  | { status: "error"; error: string };

type Owner = { orgId: string; email: string | null };

async function ownerOfSite(siteId: string): Promise<Owner | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!member) return null;

  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("user_id", member.org_id)
    .maybeSingle();
  return site ? { orgId: member.org_id as string, email: user.email ?? null } : null;
}

async function orgSiteIds(orgId: string): Promise<string[]> {
  const { data, error } = await createAdminClient().from("sites").select("id").eq("user_id", orgId);
  if (error) throw error;
  return (data ?? []).map((s) => s.id as string);
}

async function countRascalSites(siteIds: string[]): Promise<number> {
  if (siteIds.length === 0) return 0;
  const { count, error } = await createAdminClient()
    .from("site_plans")
    .select("site_id", { count: "exact", head: true })
    .in("site_id", siteIds)
    .eq("tier", "rascal");
  if (error) throw error;
  return count ?? 0;
}

/** Organisaation aiempi Stripe-asiakas, jotta laskut ja kortit pysyvät yhdessä. */
async function existingCustomerId(siteIds: string[]): Promise<string | null> {
  if (siteIds.length === 0) return null;
  const { data } = await createAdminClient()
    .from("site_plans")
    .select("stripe_customer_id")
    .in("site_id", siteIds)
    .not("stripe_customer_id", "is", null)
    .limit(1)
    .maybeSingle();
  return (data?.stripe_customer_id as string | null) ?? null;
}

/** Waitlistillä olleet saavat founding member -kupongin (−40 % 1. vuosi). */
async function isFoundingMember(email: string | null): Promise<boolean> {
  const normalized = email ? normalizeEmail(email) : null;
  if (!normalized) return false;
  const { data } = await createAdminClient()
    .from("waitlist_signups")
    .select("id")
    .eq("email", normalized)
    .maybeSingle();
  return Boolean(data);
}

export async function startPublishFlow(siteId: string, intervalInput: string): Promise<PublishFlowResult> {
  const owner = await ownerOfSite(siteId);
  if (!owner) return { status: "error", error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia." };

  try {
    const siteIds = await orgSiteIds(owner.orgId);

    // 1. Rascal-paketin sisältyvä paikka, jos vapaana.
    const rascal = await loadOrgRascalQuota(owner.orgId);
    if (hasFreeRascalSlot(rascal, await countRascalSites(siteIds))) {
      const { error } = await createAdminClient()
        .from("site_plans")
        .upsert(
          { site_id: siteId, tier: "rascal", billing_status: "none", updated_at: new Date().toISOString() },
          { onConflict: "site_id" },
        );
      if (error) throw error;
      revalidatePath(`/app/dashboard/${siteId}`);
      return { status: "activated" };
    }

    // 2. Stripe Checkout.
    const interval = parseBillingInterval(intervalInput);
    const price = interval ? stripePriceId(interval, process.env) : null;
    if (!price) return { status: "error", error: "Maksaminen ei ole vielä käytössä. Ota yhteyttä info@rascal.fi." };

    const customer = await existingCustomerId(siteIds);
    const coupon = process.env.STRIPE_FOUNDING_COUPON_ID;
    const founding = coupon ? await isFoundingMember(owner.email) : false;
    const metadata = { site_id: siteId, org_id: owner.orgId };
    const returnUrl = getAppUrl(`/dashboard/${siteId}`);

    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      client_reference_id: siteId,
      metadata,
      subscription_data: { metadata },
      ...(customer ? { customer } : owner.email ? { customer_email: owner.email } : {}),
      ...(founding && coupon ? { discounts: [{ coupon }] } : { allow_promotion_codes: true }),
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      ...(customer ? { customer_update: { address: "auto", name: "auto" } } : {}),
      success_url: `${returnUrl}?checkout=success`,
      cancel_url: `${returnUrl}?checkout=cancel`,
    });
    if (!session.url) throw new Error("Checkout-istunnolta puuttuu URL");
    return { status: "checkout", url: session.url };
  } catch (error) {
    console.error("Julkaisun maksun aloitus epäonnistui:", error);
    return { status: "error", error: "Maksun aloitus epäonnistui. Yritä hetken päästä uudelleen." };
  }
}

/** Stripe Customer Portal: kortin vaihto, laskut ja peruutus. */
export async function openBillingPortal(siteId: string): Promise<{ url?: string; error?: string }> {
  const owner = await ownerOfSite(siteId);
  if (!owner) return { error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia." };

  const { data } = await createAdminClient()
    .from("site_plans")
    .select("stripe_customer_id")
    .eq("site_id", siteId)
    .maybeSingle();
  const customer = data?.stripe_customer_id as string | null | undefined;
  if (!customer) return { error: "Sivustolla ei ole tilausta." };

  try {
    const portal = await getStripe().billingPortal.sessions.create({
      customer,
      return_url: getAppUrl(`/dashboard/${siteId}/settings`),
    });
    return { url: portal.url };
  } catch (error) {
    console.error("Laskutusportaalin avaus epäonnistui:", error);
    return { error: "Laskutusportaalin avaus epäonnistui." };
  }
}
