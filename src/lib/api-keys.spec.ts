import { describe, expect, test } from "vitest";
import { createHash } from "crypto";
import {
  API_KEY_PREFIX,
  deriveKeyPrefix,
  generateApiKey,
  hashApiKey,
  isApiKeyFormat,
} from "./api-keys";

describe("hashApiKey", () => {
  test("matches an independently computed SHA-256 hex digest", () => {
    const raw = "rp_live_example-token";
    const expected = createHash("sha256").update(raw, "utf8").digest("hex");
    expect(hashApiKey(raw)).toBe(expected);
  });

  test("is the well-known SHA-256 of a fixed string", () => {
    // sha256("hello") is a widely published constant; serves as an oracle.
    expect(hashApiKey("hello")).toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
    );
  });
});

describe("deriveKeyPrefix", () => {
  test("returns the brand prefix plus an 8-char sample of the secret", () => {
    const raw = `${API_KEY_PREFIX}0123456789abcdef`;
    expect(deriveKeyPrefix(raw)).toBe(`${API_KEY_PREFIX}01234567`);
  });
});

describe("isApiKeyFormat", () => {
  test("accepts tokens with the live prefix", () => {
    expect(isApiKeyFormat(`${API_KEY_PREFIX}whatever`)).toBe(true);
  });

  test("rejects the global ingest secret shape", () => {
    expect(isApiKeyFormat("some-shared-global-secret")).toBe(false);
  });
});

describe("generateApiKey", () => {
  test("produces a raw token whose hash and prefix are self-consistent", () => {
    const key = generateApiKey();
    expect(key).toEqual({
      raw: expect.stringMatching(new RegExp(`^${API_KEY_PREFIX}[0-9a-f]{48}$`)),
      prefix: deriveKeyPrefix(key.raw),
      hash: hashApiKey(key.raw),
    });
  });

  test("produces a unique secret on each call", () => {
    expect(generateApiKey().raw).not.toBe(generateApiKey().raw);
  });
});
