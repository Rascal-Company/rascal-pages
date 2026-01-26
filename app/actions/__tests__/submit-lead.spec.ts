import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { submitLeadCore } from "../submit-lead";
import { createTestClient, createTestSite } from "./test-helpers";
import { SiteId } from "@/src/lib/types";

describe("submitLead", () => {
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

  test("saves lead to database when site is published", async () => {
    const email = "test@example.com";
    const name = "Test User";

    const result = await submitLeadCore(client, siteId, email, name);

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    const { data: leads } = await client
      .from("leads")
      .select("*")
      .eq("site_id", siteId)
      .eq("email", email);

    expect(leads).toHaveLength(1);
    expect(leads?.[0]).toMatchObject({
      site_id: siteId,
      email: email.toLowerCase(),
      name,
      data: { source: "website_form" },
    });
  });

  test("rejects submission when site is not published", async () => {
    const testSite = await createTestSite(false);
    const unpublishedSiteId = testSite.siteId;

    const result = await submitLeadCore(
      client,
      unpublishedSiteId,
      "test@example.com",
    );

    expect(result.success).toBeUndefined();
    expect(result.error).toBe("Sivusto ei ole julkaistu.");

    await testSite.cleanup();
  });

  test("rejects invalid email addresses", async () => {
    const invalidEmails = ["not-an-email", "@example.com", "test@", "test", ""];

    for (const email of invalidEmails) {
      const result = await submitLeadCore(client, siteId, email);

      expect(result.success).toBeUndefined();
      expect(result.error).toBe("Virheellinen sähköpostiosoite.");
    }
  });

  test("accepts valid email addresses", async () => {
    const validEmails = [
      "test@example.com",
      "user+tag@domain.co.uk",
      "first.last@company.com",
    ];

    for (const email of validEmails) {
      const result = await submitLeadCore(client, siteId, email);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
    }
  });

  test("normalizes email to lowercase", async () => {
    const email = "Test.User@EXAMPLE.COM";

    const result = await submitLeadCore(client, siteId, email);

    expect(result.success).toBe(true);

    const { data: leads } = await client
      .from("leads")
      .select("email")
      .eq("site_id", siteId)
      .eq("email", email.toLowerCase());

    expect(leads).toHaveLength(1);
    expect(leads?.[0].email).toBe("test.user@example.com");
  });

  test("trims whitespace from name and email", async () => {
    const email = "  test@example.com  ";
    const name = "  Test User  ";

    const result = await submitLeadCore(client, siteId, email, name);

    expect(result.success).toBe(true);

    const { data: leads } = await client
      .from("leads")
      .select("*")
      .eq("site_id", siteId);

    expect(leads?.[0].email).toBe("test@example.com");
    expect(leads?.[0].name).toBe("Test User");
  });

  test("handles optional name parameter", async () => {
    const email = "test@example.com";

    const result = await submitLeadCore(client, siteId, email);

    expect(result.success).toBe(true);

    const { data: leads } = await client
      .from("leads")
      .select("*")
      .eq("site_id", siteId);

    expect(leads?.[0].name).toBeNull();
  });

  test("does not call webhook when webhookUrl is not provided", async () => {
    const email = "test@example.com";

    const result = await submitLeadCore(client, siteId, email, undefined);

    expect(result.success).toBe(true);
  });
});
