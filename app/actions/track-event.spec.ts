import { describe, test, expect } from "vitest";

describe("trackEvent", () => {
  describe("event type validation", () => {
    test("rejects empty event type", async () => {
      const { trackEvent } = await import("./track-event");
      const result = await trackEvent("site-id", "");
      expect(result).toEqual({ error: "Virheellinen tapahtumatyyppi." });
    });

    test("rejects invalid event type", async () => {
      const { trackEvent } = await import("./track-event");
      const result = await trackEvent("site-id", "invalid_type");
      expect(result).toEqual({ error: "Virheellinen tapahtumatyyppi." });
    });

    test("rejects potential sql injection", async () => {
      const { trackEvent } = await import("./track-event");
      const result = await trackEvent("site-id", "'; DROP TABLE analytics;--");
      expect(result).toEqual({ error: "Virheellinen tapahtumatyyppi." });
    });

    test("accepts cta_click event type", async () => {
      const { trackEvent } = await import("./track-event");
      const result = await trackEvent("site-id", "cta_click");
      // Will fail at DB level in unit test, but shouldn't fail validation
      expect(result.error).not.toBe("Virheellinen tapahtumatyyppi.");
    });

    test("accepts page_view event type", async () => {
      const { trackEvent } = await import("./track-event");
      const result = await trackEvent("site-id", "page_view");
      expect(result.error).not.toBe("Virheellinen tapahtumatyyppi.");
    });

    test("accepts form_view event type", async () => {
      const { trackEvent } = await import("./track-event");
      const result = await trackEvent("site-id", "form_view");
      expect(result.error).not.toBe("Virheellinen tapahtumatyyppi.");
    });
  });
});
