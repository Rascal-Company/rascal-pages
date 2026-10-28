import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { submitLeadCore } from "./submit-lead";
import { createSiteId } from "@/src/lib/types";
import type { SiteId } from "@/src/lib/types";
import type { createClient } from "@/src/utils/supabase/server";

// Pakettitila haetaan oikeasti Supabasesta; testeissä sivusto on julkinen.
vi.mock("@/src/lib/site-plan-server", () => ({ isSiteLive: vi.fn().mockResolvedValue(true) }));

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

const TEST_WEBHOOK_URL = "https://n8n.test/webhook/leads";
const VALID_EMAIL = "test@example.com";

function publishedSupabaseStub(): SupabaseClient {
  const maybeSingle = vi
    .fn()
    .mockResolvedValue({ data: { published: true }, error: null });
  const eqSlug = vi.fn().mockReturnValue({ maybeSingle });
  const eqSite = vi.fn().mockReturnValue({ eq: eqSlug, maybeSingle });
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

describe("submitLeadCore: lomakkeen lahja", () => {
  const siteId: SiteId = createSiteId("site-123");
  const GIFT = "org-1/site-123/gated/abcDEF12_x-Opas.pdf";
  let fetchMock: ReturnType<typeof vi.fn>;

  /** pages → julkaistu, sites → omistaja org-1. */
  function stub(): SupabaseClient {
    const from = vi.fn((table: string) => {
      const result =
        table === "sites"
          ? { data: { user_id: "org-1" }, error: null }
          : { data: { published: true }, error: null };
      const builder = { eq: () => builder, maybeSingle: () => Promise.resolve(result) };
      return { select: () => builder };
    });
    return { from } as unknown as SupabaseClient;
  }

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("N8N_RASCALPAGES_LEADS", TEST_WEBHOOK_URL);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test("palauttaa allekirjoitetun linkin ja lähettää sen webhookiin", async () => {
    const sign = vi.fn().mockResolvedValue("https://storage.test/signed");
    const result = await submitLeadCore(stub(), siteId, { email: VALID_EMAIL }, null, undefined, GIFT, sign);
    expect(sign).toHaveBeenCalledWith(GIFT, "Opas.pdf");
    expect(result).toEqual({
      success: true,
      download: { url: "https://storage.test/signed", fileName: "Opas.pdf" },
    });
    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse((init as RequestInit).body as string).download).toEqual(result.download);
  });

  test("ei allekirjoita toisen sivuston tiedostoa", async () => {
    const sign = vi.fn().mockResolvedValue("https://storage.test/signed");
    const result = await submitLeadCore(
      stub(),
      siteId,
      { email: VALID_EMAIL },
      null,
      undefined,
      "org-2/site-999/gated/abcDEF12_x-Salainen.pdf",
      sign,
    );
    expect(sign).not.toHaveBeenCalled();
    expect(result).toEqual({ success: true });
  });

  test("maksumuurin takana oleva sivusto hylkää liidin", async () => {
    const isLive = vi.fn().mockResolvedValue(false);
    const result = await submitLeadCore(stub(), siteId, { email: VALID_EMAIL }, null, undefined, null, undefined, {
      isLive,
    });
    expect(isLive).toHaveBeenCalledWith(siteId, "org-1");
    expect(result.success).toBeUndefined();
    expect(result.error).toBe("Sivusto ei ole julkaistu.");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test("liidi tallentuu, vaikka allekirjoitus epäonnistuu", async () => {
    const result = await submitLeadCore(stub(), siteId, { email: VALID_EMAIL }, null, undefined, GIFT, async () => null);
    expect(result).toEqual({ success: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("submitLeadCore: CRM-vienti rajapinnan kautta", () => {
  const siteId: SiteId = createSiteId("site-123");
  const GIFT = "org-1/site-123/gated/abcDEF12_x-Opas.pdf";
  const sign = async () => "https://storage.test/signed";
  let fetchMock: ReturnType<typeof vi.fn>;

  function stub(): SupabaseClient {
    const from = vi.fn((table: string) => {
      const result =
        table === "sites"
          ? { data: { user_id: "org-1" }, error: null }
          : { data: { published: true }, error: null };
      const builder = { eq: () => builder, maybeSingle: () => Promise.resolve(result) };
      return { select: () => builder };
    });
    return { from } as unknown as SupabaseClient;
  }

  function webhookBody() {
    const [, init] = fetchMock.mock.calls[0];
    return JSON.parse((init as RequestInit).body as string);
  }

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("N8N_RASCALPAGES_LEADS", TEST_WEBHOOK_URL);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test("vie liidin CRM:ään eikä pyydä n8n:ää tekemään sitä uudelleen", async () => {
    const sendToCrm = vi.fn().mockResolvedValue(true);
    await submitLeadCore(
      stub(),
      siteId,
      { email: VALID_EMAIL, name: "Maija", marketingConsent: true },
      null,
      { export: true, tag: " Opas " },
      GIFT,
      sign,
      { sendToCrm },
    );
    expect(sendToCrm).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        email: VALID_EMAIL,
        name: "Maija",
        marketingConsent: true,
        tag: "Opas",
        siteId,
        download: { url: "https://storage.test/signed", fileName: "Opas.pdf" },
      }),
    );
    expect(webhookBody().crm).toBeUndefined();
    // Oletuksena Rascal lähettää lahjaviestin.
    expect(webhookBody().download).toBeDefined();
  });

  test("asiakkaan CRM-automaatio lähettää lahjan: n8n ei saa linkkiä", async () => {
    await submitLeadCore(stub(), siteId, { email: VALID_EMAIL }, null, { export: true }, GIFT, sign, {
      giftDelivery: "crm",
      sendToCrm: async () => true,
    });
    expect(webhookBody().download).toBeUndefined();
  });

  test("palaa n8n-polkuun, jos CRM-kutsu epäonnistuu", async () => {
    await submitLeadCore(stub(), siteId, { email: VALID_EMAIL }, null, { export: true, tag: "x" }, GIFT, sign, {
      giftDelivery: "crm",
      sendToCrm: async () => false,
    });
    expect(webhookBody().crm).toEqual({ export: true, tag: "x" });
    expect(webhookBody().download).toBeDefined();
  });
});
