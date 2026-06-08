import { describe, expect, test } from "vitest";
import { hostToSiteDomain } from "./domains";

const ROOT = "rascalpages.fi";

describe(hostToSiteDomain, () => {
  test("extracts the subdomain from a root-domain host", () => {
    expect(hostToSiteDomain("sami.rascalpages.fi", ROOT)).toBe("sami");
  });

  test("strips the port before resolving", () => {
    expect(hostToSiteDomain("sami.localhost:3000", ROOT)).toBe("sami");
  });

  test("returns the full custom domain unchanged", () => {
    expect(hostToSiteDomain("samikiias.fi", ROOT)).toBe("samikiias.fi");
  });

  test("returns the host as-is when it equals the root domain", () => {
    expect(hostToSiteDomain("rascalpages.fi", ROOT)).toBe("rascalpages.fi");
  });
});
