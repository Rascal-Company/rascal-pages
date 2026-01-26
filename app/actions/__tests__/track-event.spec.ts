import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { trackEventCore } from "../track-event";
import { createTestClient, createTestSite } from "./test-helpers";
import { SiteId } from "@/src/lib/types";

describe("trackEvent", () => {
  let siteId: SiteId;
  let cleanup: () => Promise<void>;
  const client = createTestClient();

  beforeEach(async () => {
    const testSite = await createTestSite(true);
    siteId = testSite.siteId;
    cleanup = testSite.cleanup;
  });

  afterEach(async () => {
    await cleanup();
  });

  test("saves event to database with valid event type", async () => {
    const eventType = "page_view";
    const metadata = { url: "/test", referrer: "https://example.com" };

    const result = await trackEventCore(client, siteId, eventType, metadata);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    const { data: events } = await client
      .from("analytics_events")
      .select("*")
      .eq("site_id", siteId)
      .eq("event_type", eventType);

    expect(events).toHaveLength(1);
    expect(events?.[0]).toMatchObject({
      site_id: siteId,
      event_type: eventType,
      metadata,
    });
  });

  test("accepts all valid event types", async () => {
    const validEventTypes = ["page_view", "cta_click", "form_view"];

    for (const eventType of validEventTypes) {
      const result = await trackEventCore(client, siteId, eventType);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    }

    const { data: events } = await client
      .from("analytics_events")
      .select("event_type")
      .eq("site_id", siteId);

    expect(events).toHaveLength(3);
  });

  test("rejects invalid event types", async () => {
    const invalidEventTypes = [
      "invalid_event",
      "page-view",
      "CLICK",
      "",
      "random",
    ];

    for (const eventType of invalidEventTypes) {
      const result = await trackEventCore(client, siteId, eventType);

      expect(result.success).toBeUndefined();
      expect(result.error).toBe("Virheellinen tapahtumatyyppi.");
    }
  });

  test("stores metadata as JSONB", async () => {
    const eventType = "cta_click";
    const metadata = {
      buttonText: "Sign Up",
      href: "/signup",
      location: "hero",
      timestamp: new Date().toISOString(),
      nested: { key: "value" },
    };

    const result = await trackEventCore(client, siteId, eventType, metadata);

    expect(result.success).toBe(true);

    const { data: events } = await client
      .from("analytics_events")
      .select("metadata")
      .eq("site_id", siteId)
      .single();

    expect(events?.metadata).toEqual(metadata);
  });

  test("handles empty metadata", async () => {
    const eventType = "page_view";

    const result = await trackEventCore(client, siteId, eventType, {});

    expect(result.success).toBe(true);

    const { data: events } = await client
      .from("analytics_events")
      .select("metadata")
      .eq("site_id", siteId)
      .single();

    expect(events?.metadata).toEqual({});
  });

  test("handles default metadata parameter", async () => {
    const eventType = "page_view";

    const result = await trackEventCore(client, siteId, eventType);

    expect(result.success).toBe(true);
  });

  test("records multiple events for same site", async () => {
    const events = [
      { type: "page_view", metadata: { page: "/" } },
      { type: "cta_click", metadata: { button: "signup" } },
      { type: "page_view", metadata: { page: "/about" } },
    ];

    for (const event of events) {
      const result = await trackEventCore(
        client,
        siteId,
        event.type,
        event.metadata,
      );
      expect(result.success).toBe(true);
    }

    const { data: savedEvents, count } = await client
      .from("analytics_events")
      .select("*", { count: "exact" })
      .eq("site_id", siteId);

    expect(count).toBe(3);
    expect(savedEvents).toHaveLength(3);
  });
});
