import { beforeEach, describe, expect, it, vi } from "vitest";
import { createOverlayVariantId } from "./overlay";
import { createPreviewToken } from "./overlay-token";

/** Kyselyketju, joka palauttaa annetun vastauksen (ketjun suodattimet kirjataan). */
function chain(result: unknown, calls: string[]) {
  const builder: Record<string, unknown> = {};
  for (const method of ["select", "in", "eq", "not", "order"]) {
    builder[method] = (...args: unknown[]) => {
      calls.push(`${method}:${JSON.stringify(args)}`);
      return builder;
    };
  }
  builder.maybeSingle = () => Promise.resolve(result);
  builder.then = (resolve: (value: unknown) => void) => resolve(result);
  return builder;
}

const state: { result: unknown; calls: string[] } = { result: { data: [] }, calls: [] };

vi.mock("@/src/utils/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => chain(state.result, state.calls) }),
}));

const { resolvePagesOverlay } = await import("./overlay-pages-server");

const ORG = "org-1";
const SITE = { user_id: ORG, subdomain: "acme", custom_domain: null };
const ORIGIN = "https://acme.rascalpages.fi";

function landingPage(overrides: Record<string, unknown> = {}) {
  return {
    id: "lp-1",
    path_pattern: "/",
    match: { rp: "k7f2a9" },
    updated_at: "2026-10-01",
    overlay_campaigns: { site_id: "overlay-site", target_origin: ORIGIN, sites: { user_id: ORG } },
    overlay_variants: [{ id: "v-1", changes: [{ id: "c" }], active: true }],
    ...overrides,
  };
}

const request = (query: Record<string, string> = {}, cookies = {}) => ({ pathname: "/", query, cookies });

beforeEach(() => {
  process.env.NEXT_PUBLIC_ROOT_DOMAIN = "rascalpages.fi";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-secret";
  state.calls = [];
  state.result = { data: [landingPage()] };
});

describe("resolvePagesOverlay", () => {
  it("valitsee laskeutumissivun rp-linkillä ja luo kävijätunnisteen", async () => {
    const overlay = await resolvePagesOverlay(SITE, request({ rp: "k7f2a9" }));
    expect(overlay).toMatchObject({
      overlaySiteId: "overlay-site",
      variantId: "v-1",
      preview: false,
      params: { rp: "k7f2a9" },
    });
    expect(overlay?.visitorId).toMatch(/^[\w-]{8,64}$/);
    // Kampanjat rajataan kannassa sivuston originiin (organisaatio tarkistetaan koodissa).
    expect(state.calls).toContain(`in:${JSON.stringify(["overlay_campaigns.target_origin", [ORIGIN]])}`);
  });

  it("käyttää evästeen parametreja ja kävijätunnistetta", async () => {
    const overlay = await resolvePagesOverlay(
      SITE,
      request({}, { params: '{"rp":"k7f2a9"}', visitorId: "vid-123456" }),
    );
    expect(overlay?.visitorId).toBe("vid-123456");
  });

  it("ei näytä varianttia, kun kohdennus ei täsmää", async () => {
    expect(await resolvePagesOverlay(SITE, request({ rp: "muu" }))).toBeNull();
  });

  it("ohittaa toisen organisaation kampanjan", async () => {
    state.result = {
      data: [landingPage({ overlay_campaigns: { site_id: "x", target_origin: ORIGIN, sites: { user_id: "toinen" } } })],
    };
    expect(await resolvePagesOverlay(SITE, request({ rp: "k7f2a9" }))).toBeNull();
  });

  it("ohittaa laskeutumissivun ilman julkaistua variaatiota", async () => {
    state.result = { data: [landingPage({ overlay_variants: [{ id: "v-1", changes: [], active: false }] })] };
    expect(await resolvePagesOverlay(SITE, request({ rp: "k7f2a9" }))).toBeNull();
  });

  it("näyttää jakolinkin esikatselun ilman tilastoja", async () => {
    const variantId = createOverlayVariantId("11111111-1111-4111-8111-111111111111");
    state.result = {
      data: {
        id: variantId,
        changes: [{ id: "c" }],
        overlay_landing_pages: {
          overlay_campaigns: { site_id: "overlay-site", target_origin: ORIGIN, sites: { user_id: ORG } },
        },
      },
    };
    const token = createPreviewToken(variantId, "test-secret");
    expect(await resolvePagesOverlay(SITE, request({ t: token }))).toMatchObject({
      variantId,
      preview: true,
    });
    expect(await resolvePagesOverlay({ ...SITE, user_id: "toinen" }, request({ t: token }))).toBeNull();
    expect(await resolvePagesOverlay(SITE, request({ t: "väärä" }))).toBeNull();
  });

  it("palauttaa null kantavirheessä eikä riko sivua", async () => {
    state.result = { data: null, error: { message: "Invalid API key" } };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await resolvePagesOverlay(SITE, request({ rp: "k7f2a9" }))).toBeNull();
    spy.mockRestore();
  });
});
