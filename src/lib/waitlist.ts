import type { Brand } from "@/src/lib/types";

/** Waitlist-ilmoittautujan oma kutsukoodi (RAS-1167). */
export type ReferralCode = Brand<string, "ReferralCode">;

/** Montako sijaa jokainen kutsuttu kaveri nostaa jonossa. */
export const REFERRAL_JUMP = 5;

// Ei sekoittuvia merkkejä (0/O, 1/I/L), jotta koodin voi lukea ääneen.
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;
const CODE_PATTERN = new RegExp(`^[${CODE_ALPHABET}]{${CODE_LENGTH}}$`);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const EMAIL_MAX_LENGTH = 254;

/** Siistii sähköpostin vertailukelpoiseksi; null jos osoite ei kelpaa. */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (email.length === 0 || email.length > EMAIL_MAX_LENGTH) return null;
  return EMAIL_PATTERN.test(email) ? email : null;
}

/** Luo kutsukoodin annetuista satunnaistavuista (testattava ilman crypto-mokkia). */
export function referralCodeFromBytes(bytes: Uint8Array): ReferralCode {
  if (bytes.length < CODE_LENGTH) {
    throw new Error(`referralCodeFromBytes tarvitsee vähintään ${CODE_LENGTH} tavua`);
  }
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  }
  return code as ReferralCode;
}

export function generateReferralCode(): ReferralCode {
  return referralCodeFromBytes(crypto.getRandomValues(new Uint8Array(CODE_LENGTH)));
}

/** Tarkistaa URL:sta tai lomakkeelta tulevan koodin; null jos muoto ei kelpaa. */
export function parseReferralCode(raw: string | null | undefined): ReferralCode | null {
  const code = raw?.trim().toUpperCase() ?? "";
  return CODE_PATTERN.test(code) ? (code as ReferralCode) : null;
}

/**
 * Jonosija: ilmoittautumisjärjestys miinus kutsujen tuoma nousu.
 * `signupRank` on 1-pohjainen (ensimmäinen ilmoittautuja = 1).
 */
export function queuePosition(signupRank: number, referralCount: number): number {
  return Math.max(1, signupRank - referralCount * REFERRAL_JUMP);
}

export function waitlistShareUrl(code: ReferralCode, rootDomain: string): string {
  return `https://${rootDomain}/?ref=${code}`;
}
