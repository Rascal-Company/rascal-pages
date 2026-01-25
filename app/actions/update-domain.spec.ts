import { describe, expect, test } from "vitest";

// Helper functions to test (exported for testing)
function cleanDomain(domain: string): string {
  return domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");
}

function isValidDomain(domain: string): boolean {
  const domainRegex = /^([a-z0-9]([a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/i;
  return domainRegex.test(domain);
}

describe("cleanDomain", () => {
  test("removes https:// prefix", () => {
    expect(cleanDomain("https://example.com")).toBe("example.com");
  });

  test("removes http:// prefix", () => {
    expect(cleanDomain("http://example.com")).toBe("example.com");
  });

  test("removes www. prefix", () => {
    expect(cleanDomain("www.example.com")).toBe("example.com");
  });

  test("removes trailing slashes", () => {
    expect(cleanDomain("example.com/")).toBe("example.com");
  });

  test("removes multiple trailing slashes", () => {
    expect(cleanDomain("example.com///")).toBe("example.com");
  });

  test("converts to lowercase", () => {
    expect(cleanDomain("Example.COM")).toBe("example.com");
  });

  test("trims whitespace", () => {
    expect(cleanDomain("  example.com  ")).toBe("example.com");
  });

  test("handles complex case with all transformations", () => {
    expect(cleanDomain("  HTTPS://WWW.Example.COM///  ")).toBe("example.com");
  });

  test("returns empty string for empty input", () => {
    expect(cleanDomain("")).toBe("");
  });

  test("handles subdomain correctly", () => {
    expect(cleanDomain("https://kampanja.yritys.fi/")).toBe(
      "kampanja.yritys.fi",
    );
  });
});

describe("isValidDomain", () => {
  test("accepts valid domain with subdomain", () => {
    expect(isValidDomain("kampanja.yritys.fi")).toBe(true);
  });

  test("accepts valid simple domain", () => {
    expect(isValidDomain("example.com")).toBe(true);
  });

  test("accepts domain with multiple subdomains", () => {
    expect(isValidDomain("sub.domain.example.com")).toBe(true);
  });

  test("accepts domain with hyphens", () => {
    expect(isValidDomain("my-site.example.com")).toBe(true);
  });

  test("accepts domain with numbers", () => {
    expect(isValidDomain("site123.example.com")).toBe(true);
  });

  test("rejects domain without TLD", () => {
    expect(isValidDomain("example")).toBe(false);
  });

  test("rejects domain with spaces", () => {
    expect(isValidDomain("exam ple.com")).toBe(false);
  });

  test("rejects domain starting with hyphen", () => {
    expect(isValidDomain("-example.com")).toBe(false);
  });

  test("rejects domain ending with hyphen", () => {
    expect(isValidDomain("example-.com")).toBe(false);
  });

  test("rejects domain with special characters", () => {
    expect(isValidDomain("example!.com")).toBe(false);
  });

  test("rejects domain with underscore", () => {
    expect(isValidDomain("example_site.com")).toBe(false);
  });

  test("rejects empty string", () => {
    expect(isValidDomain("")).toBe(false);
  });

  test("rejects domain with only TLD", () => {
    expect(isValidDomain(".com")).toBe(false);
  });

  test("rejects domain starting with dot", () => {
    expect(isValidDomain(".example.com")).toBe(false);
  });

  test("rejects domain ending with dot", () => {
    expect(isValidDomain("example.com.")).toBe(false);
  });

  test("accepts international TLD", () => {
    expect(isValidDomain("example.technology")).toBe(true);
  });
});
