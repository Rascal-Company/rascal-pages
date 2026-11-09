import { describe, expect, it } from "vitest";
import { orgsWithoutPagesAccess, pickActiveMembership, type Membership, type OrgId } from "./active-org";

const m = (org: string, role: string | null, impersonating?: string): Membership => ({
  org_id: org as OrgId,
  role,
  impersonating_from_org_id: impersonating ?? null,
});

describe("pickActiveMembership", () => {
  it("returns null without memberships", () => {
    expect(pickActiveMembership([], "a")).toBeNull();
  });

  it("returns the only membership", () => {
    expect(pickActiveMembership([m("a", "member")], null)?.org_id).toBe("a");
  });

  it("honours the user's choice when still a member", () => {
    const list = [m("a", "owner"), m("b", "member")];
    expect(pickActiveMembership(list, "b")?.org_id).toBe("b");
  });

  it("ignores a choice the user is no longer a member of", () => {
    const list = [m("a", "member"), m("b", "owner")];
    expect(pickActiveMembership(list, "gone")?.org_id).toBe("b");
  });

  it("impersonation wins over the choice", () => {
    const list = [m("a", "owner"), m("b", "member", "a")];
    expect(pickActiveMembership(list, "a")?.org_id).toBe("b");
  });

  it("ignores a choice where Pages is restricted", () => {
    const list = [m("a", "owner"), m("b", "owner")];
    expect(pickActiveMembership(list, "a", new Set(["a"]))?.org_id).toBe("b");
  });

  it("prefers unrestricted org over higher role", () => {
    const list = [m("a", "owner"), m("b", "member")];
    expect(pickActiveMembership(list, null, new Set(["a"]))?.org_id).toBe("b");
  });

  it("falls back to highest role", () => {
    const list = [m("a", "member"), m("b", "admin"), m("c", "owner")];
    expect(pickActiveMembership(list, null)?.org_id).toBe("c");
  });

  it("breaks role ties by org_id regardless of input order", () => {
    expect(pickActiveMembership([m("z", "owner"), m("b", "owner")], null)?.org_id).toBe("b");
    expect(pickActiveMembership([m("b", "owner"), m("z", "owner")], null)?.org_id).toBe("b");
  });
});

describe("orgsWithoutPagesAccess", () => {
  const row = (org: string, slug: string) => ({
    organization_products: { org_id: org, products: { slug } },
  });

  it("returns orgs whose restriction excludes Pages", () => {
    const rows = [row("a", "rascal-crm"), row("b", "rascal-pages"), row("b", "rascal-crm")];
    expect([...orgsWithoutPagesAccess(rows)]).toEqual(["a"]);
  });

  it("handles null", () => {
    expect(orgsWithoutPagesAccess(null).size).toBe(0);
  });
});
