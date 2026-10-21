/**
 * Allekirjoitettu esikatselutunniste overlay-variantille. Linkillä variantin
 * voi näyttää ilman kirjautumista ja ilman asennettua snippetiä (myynti/demo).
 * Tunniste ei vanhene; variantin poistaminen mitätöi sen.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { isValidUuid } from "./types";
import { createOverlayVariantId, type OverlayVariantId } from "./overlay";

const SIGNATURE_LENGTH = 32;

function sign(variantId: string, secret: string): string {
  return createHmac("sha256", `overlay-preview:${secret}`)
    .update(variantId)
    .digest("base64url")
    .slice(0, SIGNATURE_LENGTH);
}

export function createPreviewToken(variantId: OverlayVariantId, secret: string): string {
  return `${variantId}.${sign(variantId, secret)}`;
}

export function verifyPreviewToken(
  token: string,
  secret: string,
): OverlayVariantId | null {
  const [variantId, signature, ...rest] = token.split(".");
  if (rest.length || !variantId || !signature || !isValidUuid(variantId)) return null;

  const expected = Buffer.from(sign(variantId, secret));
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }
  return createOverlayVariantId(variantId);
}

/** Palvelinpuolen avain: johdetaan service role -avaimesta, ei erillistä env-muuttujaa. */
export function previewSecret(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY puuttuu");
  return key;
}
