import { describe, expect, test } from "vitest";
import { planProvision } from "./provision-site";

describe("planProvision", () => {
  test("lists the provisioning steps for a subdomain-only site", () => {
    expect(planProvision({ subdomain: "acme", name: "Acme" })).toEqual([
      "create repo rascal-site-acme from template",
      "seed content/site.json + content/posts/tervetuloa.md",
      "create Vercel project rascal-site-acme",
      "assign domain acme.rascalpages.fi",
      "upsert sites registry (subdomain=acme)",
    ]);
  });

  test("includes a custom domain step when provided", () => {
    const steps = planProvision({
      subdomain: "samikiias",
      name: "Sami",
      customDomain: "samikiias.fi",
    });

    expect(steps).toContain("assign custom domain samikiias.fi");
  });
});
