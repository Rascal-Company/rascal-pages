import { describe, expect, test } from "vitest";
import {
  buildRepoName,
  buildSubdomainHost,
  isValidSubdomain,
} from "./names";

describe("buildRepoName", () => {
  test("prefixes the subdomain with rascal-site-", () => {
    expect(buildRepoName("samikiias")).toBe("rascal-site-samikiias");
  });
});

describe("buildSubdomainHost", () => {
  test("joins subdomain with the default root domain", () => {
    expect(buildSubdomainHost("samikiias")).toBe("samikiias.rascalpages.fi");
  });

  test("honours a custom root domain", () => {
    expect(buildSubdomainHost("acme", "example.com")).toBe("acme.example.com");
  });
});

describe("isValidSubdomain", () => {
  test.each([
    ["samikiias", true],
    ["acme-co", true],
    ["a1", true],
    ["-bad", false],
    ["bad-", false],
    ["Bad", false],
    ["has space", false],
    ["", false],
  ])("isValidSubdomain(%j) === %s", (input, expected) => {
    expect(isValidSubdomain(input)).toBe(expected);
  });
});
