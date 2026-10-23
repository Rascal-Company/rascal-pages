// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const state: { user: object | null; member: object | null; products: unknown; error: unknown } = {
  user: { id: "auth-1" },
  member: { org_id: "org-1" },
  products: [],
  error: null,
};

vi.mock("@/src/utils/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser: async () => ({ data: { user: state.user } }) },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: state.member }) }) }),
    }),
    rpc: async () => ({ data: state.products, error: state.error }),
  }),
}));
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
});
