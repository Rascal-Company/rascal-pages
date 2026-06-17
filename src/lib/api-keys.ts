/**
 * Org-scoped API key domain model and pure helpers.
 *
 * Keys authenticate an organization against the content ingestion endpoint
 * (`/api/posts`). The raw token is shown to the user exactly once at creation
 * time; only its SHA-256 hash and a short display prefix are stored. Keeping
 * generation/hashing pure makes it trivially testable and keeps the route and
 * server actions thin.
 */

import { createHash, randomBytes } from "crypto";
import type { Brand } from "./types";

export type ApiKeyId = Brand<string, "ApiKeyId">;

export function createApiKeyId(id: string): ApiKeyId {
  return id as ApiKeyId;
}

/** Human-recognizable prefix for live keys. */
export const API_KEY_PREFIX = "rp_live_";

/** Number of random bytes in the secret part (48 hex chars). */
const RANDOM_BYTES = 24;

/** How many chars of the random part to keep in the display prefix. */
const PREFIX_SAMPLE = 8;

export type GeneratedApiKey = {
  /** Full token, shown to the user once and never stored. */
  raw: string;
  /** Short, non-secret identifier safe to display in the UI. */
  prefix: string;
  /** SHA-256 hex digest of the raw token; this is what gets stored. */
  hash: string;
};

/**
 * Generate a fresh API key. The caller stores `hash` + `prefix` and returns
 * `raw` to the user a single time.
 */
export function generateApiKey(): GeneratedApiKey {
  const raw = `${API_KEY_PREFIX}${randomBytes(RANDOM_BYTES).toString("hex")}`;
  return { raw, prefix: deriveKeyPrefix(raw), hash: hashApiKey(raw) };
}

/** SHA-256 hex digest used for storage and lookup. */
export function hashApiKey(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}

/** Non-secret display prefix: the brand prefix plus a short sample. */
export function deriveKeyPrefix(raw: string): string {
  return raw.slice(0, API_KEY_PREFIX.length + PREFIX_SAMPLE);
}

/**
 * Whether a bearer token looks like an org API key (vs. the first-party global
 * ingest secret). Used by the endpoint to choose the auth path.
 */
export function isApiKeyFormat(token: string): boolean {
  return token.startsWith(API_KEY_PREFIX);
}
