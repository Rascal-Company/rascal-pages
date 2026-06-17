import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { submitLeadCore } from "./submit-lead";
import { createSiteId } from "@/src/lib/types";
import type { SiteId } from "@/src/lib/types";
import type { createClient } from "@/src/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const TEST_WEBHOOK_URL = "https://n8n.test/webhook/leads";
const VALID_EMAIL = "test@example.com";

function publishedSupabaseStub(): SupabaseClient {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: { published: true }, error: null });
  const eqSlug = vi.fn().mockReturnValue({ maybeSingle });
  const eqSite = vi.fn().mockReturnValue({ eq: eqSlug });
  const select = vi.fn().mockReturnValue({ eq: eqSite });
  const from = vi.fn().mockReturnValue({ select });
  return { from } as unknown as SupabaseClient;
}

function lastFetchBody(fetchMock: ReturnType<typeof vi.fn>): {
  type: string;
  siteId: string;
  fields: Record<string, unknown>;
  timestamp: string;
  crm?: { export: boolean; tag: string | null };
} {
  const [, init] = fetchMock.mock.calls[0];
  return JSON.parse((init as RequestInit).body as string);
}

describe("submitLeadCore", () => {
  let supabase: SupabaseClient;
  let fetchMock: ReturnType<typeof vi.fn>;
  const siteId: SiteId = createSiteId("site-123");

  beforeEach(() => {
    supabase = publishedSupabaseStub();
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("N8N_RASCALPAGES_LEADS", TEST_WEBHOOK_URL);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  test("includes crm: { export: true, tag } when crm.export is true", async () => {
    const result = await submitLeadCore(
      supabase,
      siteId,
      { email: VALID_EMAIL },
      null,
      { export: true, tag: "Lander X" },
    );

    expect(result.success).toBe(true);
    expect(lastFetchBody(fetchMock).crm).toEqual({
      export: true,
      tag: "Lander X",
    });
  });

  test("omits crm key when crm is not provided", async () => {
    const result = await submitLeadCore(supabase, siteId, {
      email: VALID_EMAIL,
    });

    expect(result.success).toBe(true);
    expect(lastFetchBody(fetchMock)).not.toHaveProperty("crm");
  });

  test("omits crm key when crm.export is false", async () => {
    const result = await submitLeadCore(supabase, siteId, { email: VALID_EMAIL }, null, {
      export: false,
      tag: "Lander X",
    });

    expect(result.success).toBe(true);
    expect(lastFetchBody(fetchMock)).not.toHaveProperty("crm");
  });

  test("trims the crm tag", async () => {
    await submitLeadCore(supabase, siteId, { email: VALID_EMAIL }, null, {
      export: true,
      tag: "  Lander X  ",
    });

    expect(lastFetchBody(fetchMock).crm).toEqual({
      export: true,
      tag: "Lander X",
    });
  });

  test("sets tag to null for a whitespace-only tag", async () => {
    await submitLeadCore(supabase, siteId, { email: VALID_EMAIL }, null, {
      export: true,
      tag: "   ",
    });

    expect(lastFetchBody(fetchMock).crm).toEqual({ export: true, tag: null });
  });

  test("sets tag to null when tag is omitted", async () => {
    await submitLeadCore(supabase, siteId, { email: VALID_EMAIL }, null, {
      export: true,
    });

    expect(lastFetchBody(fetchMock).crm).toEqual({ export: true, tag: null });
  });

  test("returns success without calling webhook for a bot honeypot submission", async () => {
    const result = await submitLeadCore(supabase, siteId, {
      email: VALID_EMAIL,
      _hp_website: "spam",
    });

    expect(result.success).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("returns an error for an invalid email", async () => {
    const result = await submitLeadCore(supabase, siteId, {
      email: "not-an-email",
    });

    expect(result.error).toBe("Virheellinen sähköpostiosoite.");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
