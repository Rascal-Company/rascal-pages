import { describe, expect, test } from "vitest";
import { mapToRegistryRow } from "./registry";

describe("mapToRegistryRow", () => {
  test("maps a full provisioning result into a registry row", () => {
    const row = mapToRegistryRow({
      subdomain: "samikiias",
      customDomain: "samikiias.fi",
      repoName: "rascal-site-samikiias",
      repoUrl: "https://github.com/rascal-sites/rascal-site-samikiias",
      vercelProjectId: "prj_123",
      status: "domain_assigned",
    });

    expect(row).toEqual({
      subdomain: "samikiias",
      custom_domain: "samikiias.fi",
      repo_name: "rascal-site-samikiias",
      repo_url: "https://github.com/rascal-sites/rascal-site-samikiias",
      vercel_project_id: "prj_123",
      provision_status: "domain_assigned",
    });
  });

  test("nulls optional fields when absent", () => {
    const row = mapToRegistryRow({
      subdomain: "acme",
      repoName: "rascal-site-acme",
      repoUrl: "https://github.com/rascal-sites/rascal-site-acme",
      status: "repo_created",
    });

    expect(row.custom_domain).toBeNull();
    expect(row.vercel_project_id).toBeNull();
  });
});
