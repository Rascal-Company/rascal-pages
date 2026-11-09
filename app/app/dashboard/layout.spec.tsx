// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const state: {
  user: object | null;
  member: object | null;
  products: unknown;
  productsByOrg: Record<string, unknown>;
  brandContext: unknown;
  error: unknown;
} = {
  productsByOrg: {},
  brandContext: null,
  user: { id: "auth-1" },
  member: { org_id: "org-1" },
  products: [],
  error: null,
};

vi.mock("@/src/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    rpc: async (_fn: string, args: { p_org_id: string }) => ({
      data: state.productsByOrg[args.p_org_id] ?? state.products,
      error: state.error,
    }),
  }),
}));
vi.mock("@/src/lib/active-org", () => ({
  getActiveOrgMember: async () => state.member,
}));
vi.mock("@/app/actions/brand", () => ({ getBrandContext: async () => state.brandContext }));
vi.mock("@/app/components/AccountMenu", () => ({ AccountMenu: () => null }));

const { default: DashboardLayout } = await import("./layout");

async function renderLayout() {
  return render(await DashboardLayout({ children: <p>Dashboard</p> }));
}

const pages = (overrides: object = {}) => [
  { product_slug: "rascal-pages", is_enabled: true, plan_tier: "pro", trial_ends_at: null, has_access: true, ...overrides },
];

beforeEach(() => {
  state.user = { id: "auth-1" };
  state.member = { org_id: "org-1" };
  state.products = pages();
  state.error = null;
  state.productsByOrg = {};
  state.brandContext = null;
});

describe("DashboardLayout", () => {
  it("näyttää dashboardin, kun organisaatiolla on Rascal Pages", async () => {
    const { getByText } = await renderLayout();
    expect(getByText("Dashboard")).toBeTruthy();
  });

  it("näyttää Ei käyttöoikeutta ilman Rascal Pages -tuotetta", async () => {
    state.products = [{ ...pages()[0], product_slug: "rascal-ai" }];
    const { getByText, queryByText } = await renderLayout();
    expect(getByText("Ei käyttöoikeutta")).toBeTruthy();
    expect(queryByText("Dashboard")).toBeNull();
  });

  it("kertoo päättyneestä kokeilusta", async () => {
    state.products = pages({ plan_tier: "trial", trial_ends_at: "2020-01-01T00:00:00Z", has_access: false });
    const { getByText } = await renderLayout();
    expect(getByText("Kokeilujakso päättynyt")).toBeTruthy();
  });

  it("ei lukitse käyttäjää ulos tarkistuksen virheessä", async () => {
    state.error = { message: "timeout" };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { getByText } = await renderLayout();
    expect(getByText("Dashboard")).toBeTruthy();
    spy.mockRestore();
  });

  it("tarjoaa siirtymän toiseen brändiin, jolla Pages on", async () => {
    state.products = [{ ...pages()[0], product_slug: "rascal-ai" }];
    state.productsByOrg = { "org-2": pages(), "org-3": [] };
    state.brandContext = {
      activeOrgId: "org-1",
      brands: [
        { id: "org-1", name: "Aktiivinen", logoUrl: null },
        { id: "org-2", name: "Mak8r", logoUrl: null },
        { id: "org-3", name: "Ilman Pagesia", logoUrl: null },
      ],
    };
    const { getByText, queryByText } = await renderLayout();
    expect(getByText("Siirry: Mak8r")).toBeTruthy();
    expect(queryByText("Siirry: Ilman Pagesia")).toBeNull();
    expect(queryByText("Siirry: Aktiivinen")).toBeNull();
  });
});
