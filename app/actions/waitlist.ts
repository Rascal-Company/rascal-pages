"use server";

import { headers } from "next/headers";
import { createAdminClient } from "@/src/utils/supabase/admin";
import { RateLimiter } from "@/src/lib/rate-limit";
import { addBrevoContact } from "@/src/lib/brevo";
import {
  generateReferralCode,
  normalizeEmail,
  parseReferralCode,
  queuePosition,
  waitlistShareUrl,
  type ReferralCode,
} from "@/src/lib/waitlist";

export type WaitlistState =
  | { status: "idle" }
  | { status: "error"; error: string }
  | { status: "joined"; position: number; shareUrl: string };

type SignupRow = { referral_code: string; created_at: string };

const waitlistLimiter = new RateLimiter({ maxRequests: 5, windowMs: 15 * 60 * 1000 });

// Postgresin virhekoodit: unique-rikkomus ja viiteavaimen rikkomus.
const UNIQUE_VIOLATION = "23505";
const FOREIGN_KEY_VIOLATION = "23503";
const CODE_ATTEMPTS = 3;

type AdminClient = ReturnType<typeof createAdminClient>;

async function findSignup(supabase: AdminClient, email: string): Promise<SignupRow | null> {
  const { data } = await supabase
    .from("waitlist_signups")
    .select("referral_code, created_at")
    .eq("email", email)
    .maybeSingle();
  return (data as SignupRow | null) ?? null;
}

async function insertSignup(
  supabase: AdminClient,
  email: string,
  referredBy: ReferralCode | null,
  source: string | null,
): Promise<SignupRow | null> {
  let ref = referredBy;
  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt++) {
    const { data, error } = await supabase
      .from("waitlist_signups")
      .insert({ email, referral_code: generateReferralCode(), referred_by: ref, source })
      .select("referral_code, created_at")
      .single();

    if (!error) return data as SignupRow;

    // Kutsukoodia ei ole olemassa: liitytään ilman kutsujaa.
    if (error.code === FOREIGN_KEY_VIOLATION && ref) {
      ref = null;
      continue;
    }
    if (error.code === UNIQUE_VIOLATION) {
      // Sama sähköposti ehti jonoon rinnakkaisesta pyynnöstä; muuten koodi törmäsi.
      const existing = await findSignup(supabase, email);
      if (existing) return existing;
      continue;
    }
    console.error("Waitlist-ilmoittautuminen epäonnistui:", error);
    return null;
  }
  return null;
}

async function positionOf(supabase: AdminClient, signup: SignupRow): Promise<number> {
  const [{ count: rank }, { count: referrals }] = await Promise.all([
    supabase
      .from("waitlist_signups")
      .select("id", { count: "exact", head: true })
      .lte("created_at", signup.created_at),
    supabase
      .from("waitlist_signups")
      .select("id", { count: "exact", head: true })
      .eq("referred_by", signup.referral_code),
  ]);
  return queuePosition(rank ?? 1, referrals ?? 0);
}

/** Liittää sähköpostin waitlistille; sama osoite uudelleen palauttaa nykyisen sijan. */
export async function joinWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  // Honeypot: ihminen ei näe kenttää, botti täyttää sen.
  if (formData.get("_hp_website")) {
    return { status: "error", error: "Ilmoittautuminen ei onnistunut. Yritä uudelleen." };
  }

  const headerStore = await headers();
  const ip = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!waitlistLimiter.check(ip).allowed) {
    return { status: "error", error: "Liian monta yritystä. Yritä myöhemmin uudelleen." };
  }

  const email = normalizeEmail(String(formData.get("email") ?? ""));
  if (!email) {
    return { status: "error", error: "Tarkista sähköpostiosoite." };
  }

  const referredBy = parseReferralCode(formData.get("ref")?.toString());
  const source = formData.get("source")?.toString().slice(0, 100) || null;

  const supabase = createAdminClient();
  const existing = await findSignup(supabase, email);
  const signup = existing ?? (await insertSignup(supabase, email, referredBy, source));
  if (!signup) {
    return { status: "error", error: "Ilmoittautuminen ei onnistunut. Yritä hetken päästä uudelleen." };
  }

  // Postituslista Brevoon; epäonnistuminen ei estä jonoon pääsyä (oma taulu on totuus).
  if (!existing) {
    await addBrevoContact(email, process.env.BREVO_WAITLIST_LIST_ID);
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi";
  return {
    status: "joined",
    position: await positionOf(supabase, signup),
    shareUrl: waitlistShareUrl(signup.referral_code as ReferralCode, rootDomain),
  };
}

/** Jonon pituus etusivulle; null jos haku ei onnistu (esim. build ilman avaimia). */
export async function getWaitlistCount(): Promise<number | null> {
  try {
    const { count, error } = await createAdminClient()
      .from("waitlist_signups")
      .select("id", { count: "exact", head: true });
    return error ? null : (count ?? 0);
  } catch {
    return null;
  }
}
