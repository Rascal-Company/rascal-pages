import { describe, test, expect } from "vitest";

describe("submitLead", () => {
  describe("email validation", () => {
    test("rejects empty email", async () => {
      const { submitLead } = await import("./submit-lead");
      const result = await submitLead("site-id", "");
      expect(result).toEqual({ error: "Virheellinen sähköpostiosoite." });
    });

    test("rejects invalid email without @", async () => {
      const { submitLead } = await import("./submit-lead");
      const result = await submitLead("site-id", "notanemail");
      expect(result).toEqual({ error: "Virheellinen sähköpostiosoite." });
    });

    test("rejects invalid email with only @", async () => {
      const { submitLead } = await import("./submit-lead");
      const result = await submitLead("site-id", "@example.com");
      expect(result).toEqual({ error: "Virheellinen sähköpostiosoite." });
    });

    test("rejects invalid email without domain", async () => {
      const { submitLead } = await import("./submit-lead");
      const result = await submitLead("site-id", "user@");
      expect(result).toEqual({ error: "Virheellinen sähköpostiosoite." });
    });

    test("rejects email with spaces", async () => {
      const { submitLead } = await import("./submit-lead");
      const result = await submitLead("site-id", "user @example.com");
      expect(result).toEqual({ error: "Virheellinen sähköpostiosoite." });
    });

    test("accepts valid simple email", async () => {
      const { submitLead } = await import("./submit-lead");
      const result = await submitLead("site-id", "user@example.com");
      // Will fail at DB level in unit test, but shouldn't fail validation
      expect(result.error).not.toBe("Virheellinen sähköpostiosoite.");
    });

    test("accepts valid email with subdomain", async () => {
      const { submitLead } = await import("./submit-lead");
      const result = await submitLead("site-id", "test@mail.example.com");
      expect(result.error).not.toBe("Virheellinen sähköpostiosoite.");
    });

    test("accepts valid email with plus sign", async () => {
      const { submitLead } = await import("./submit-lead");
      const result = await submitLead("site-id", "user+tag@example.com");
      expect(result.error).not.toBe("Virheellinen sähköpostiosoite.");
    });
  });
});
