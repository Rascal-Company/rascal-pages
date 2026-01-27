import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { updateSiteSettingsCore } from "../update-site-settings";
import { mergeSettings } from "../utils/settings-utils";
import { createTestClient, createTestSite } from "./test-helpers";
import type { SiteId } from "@/src/lib/types";

describe("mergeSettings", () => {
  test("merges new settings into empty current settings", () => {
    const result = mergeSettings({}, { googleTagManagerId: "GTM-123" });

    expect(result).toEqual({ googleTagManagerId: "GTM-123" });
  });

  test("preserves existing settings when adding new ones", () => {
    const current = { existingKey: "value", googleTagManagerId: "GTM-OLD" };
    const result = mergeSettings(current, { metaPixelId: "123456" });

    expect(result).toEqual({
      existingKey: "value",
      googleTagManagerId: "GTM-OLD",
      metaPixelId: "123456",
    });
  });

  test("overwrites existing analytics settings with new values", () => {
    const current = { googleTagManagerId: "GTM-OLD", otherSetting: true };
    const result = mergeSettings(current, { googleTagManagerId: "GTM-NEW" });

    expect(result).toEqual({
      googleTagManagerId: "GTM-NEW",
      otherSetting: true,
    });
  });

  test("handles undefined values in new settings", () => {
    const current = { googleTagManagerId: "GTM-123" };
    const result = mergeSettings(current, {
      googleTagManagerId: undefined,
      metaPixelId: "456",
    });

    expect(result).toEqual({
      googleTagManagerId: undefined,
      metaPixelId: "456",
    });
  });

  test("handles both settings being set at once", () => {
    const result = mergeSettings(
      {},
      { googleTagManagerId: "GTM-123", metaPixelId: "456789" },
    );

    expect(result).toEqual({
      googleTagManagerId: "GTM-123",
      metaPixelId: "456789",
    });
  });
});

describe("updateSiteSettingsCore", () => {
  let siteId: SiteId;
  let userId: string;
  let cleanup: () => Promise<void>;
  const client = createTestClient();

  beforeEach(async () => {
    const testSite = await createTestSite(true);
    siteId = testSite.siteId;
    cleanup = testSite.cleanup;

    // Get the user_id for this site
    const { data: site } = await client
      .from("sites")
      .select("user_id")
      .eq("id", siteId)
      .single();
    userId = site!.user_id;
  });

  afterEach(async () => {
    await cleanup();
  });

  test("saves analytics settings to database", async () => {
    const settings = {
      googleTagManagerId: "GTM-TEST123",
      metaPixelId: "9876543210",
    };

    const result = await updateSiteSettingsCore(
      client,
      siteId,
      userId,
      settings,
    );

    expect(result).toEqual({ success: true });

    const { data: site } = await client
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();

    expect(site?.settings).toMatchObject({
      googleTagManagerId: "GTM-TEST123",
      metaPixelId: "9876543210",
    });
  });

  test("preserves existing settings when updating", async () => {
    // First, set initial settings
    await client
      .from("sites")
      .update({ settings: { existingKey: "preserved", metaPixelId: "old" } })
      .eq("id", siteId);

    // Update with new GTM ID
    const result = await updateSiteSettingsCore(client, siteId, userId, {
      googleTagManagerId: "GTM-NEW",
    });

    expect(result).toEqual({ success: true });

    const { data: site } = await client
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();

    expect(site?.settings).toMatchObject({
      existingKey: "preserved",
      metaPixelId: "old",
      googleTagManagerId: "GTM-NEW",
    });
  });

  test("returns error for non-existent site", async () => {
    const fakeSiteId = "00000000-0000-0000-0000-000000000000" as SiteId;

    const result = await updateSiteSettingsCore(client, fakeSiteId, userId, {
      googleTagManagerId: "GTM-123",
    });

    expect(result).toEqual({
      success: false,
      error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia.",
    });
  });

  test("returns error when user does not own the site", async () => {
    const wrongUserId = "00000000-0000-0000-0000-000000000000";

    const result = await updateSiteSettingsCore(client, siteId, wrongUserId, {
      googleTagManagerId: "GTM-123",
    });

    expect(result).toEqual({
      success: false,
      error: "Sivustoa ei löydy tai sinulla ei ole oikeuksia.",
    });
  });

  test("updates updated_at timestamp", async () => {
    const { data: siteBefore } = await client
      .from("sites")
      .select("updated_at")
      .eq("id", siteId)
      .single();

    // Small delay to ensure timestamp difference
    await new Promise((resolve) => setTimeout(resolve, 10));

    await updateSiteSettingsCore(client, siteId, userId, {
      googleTagManagerId: "GTM-123",
    });

    const { data: siteAfter } = await client
      .from("sites")
      .select("updated_at")
      .eq("id", siteId)
      .single();

    expect(new Date(siteAfter!.updated_at).getTime()).toBeGreaterThan(
      new Date(siteBefore!.updated_at).getTime(),
    );
  });

  test("clears settings by setting empty string", async () => {
    // First set a value
    await updateSiteSettingsCore(client, siteId, userId, {
      googleTagManagerId: "GTM-123",
      metaPixelId: "456",
    });

    // Then clear GTM by setting empty string (undefined is stripped by JSON)
    await updateSiteSettingsCore(client, siteId, userId, {
      googleTagManagerId: "",
    });

    const { data: site } = await client
      .from("sites")
      .select("settings")
      .eq("id", siteId)
      .single();

    expect(site?.settings).toMatchObject({
      googleTagManagerId: "",
      metaPixelId: "456",
    });
  });
});
