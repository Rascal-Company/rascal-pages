import { describe, expect, test } from "vitest";
import { buildSeedFiles, buildSiteJson, buildWelcomePost } from "./seed";

const input = {
  subdomain: "samikiias",
  customDomain: "samikiias.fi",
  name: "Sami Kiias",
  url: "https://samikiias.fi",
};

describe("buildSiteJson", () => {
  test("produces parseable site.json with meta and personal-brand sections", () => {
    const parsed = JSON.parse(buildSiteJson(input));

    expect(parsed.subdomain).toBe("samikiias");
    expect(parsed.customDomain).toBe("samikiias.fi");
    expect(parsed.site).toEqual({
      name: "Sami Kiias",
      url: "https://samikiias.fi",
    });
    expect(parsed.templateId).toBe("personal-brand");
    expect(parsed.sections.map((s: { type: string }) => s.type)).toEqual([
      "hero",
      "about",
      "blog",
      "footer",
    ]);
  });

  test("omits customDomain when not provided", () => {
    const parsed = JSON.parse(
      buildSiteJson({ subdomain: "acme", name: "Acme", url: "https://x" }),
    );

    expect(parsed.customDomain).toBeUndefined();
  });
});

describe("buildWelcomePost", () => {
  test("embeds the given date and is published", () => {
    const post = buildWelcomePost("2026-06-08");

    expect(post).toContain("date: 2026-06-08");
    expect(post).toContain("published: true");
  });
});

describe("buildSeedFiles", () => {
  test("writes site.json and a welcome post to the expected paths", () => {
    const files = buildSeedFiles(input, "2026-06-08");

    expect(files.map((f) => f.path)).toEqual([
      "content/site.json",
      "content/posts/tervetuloa.md",
    ]);
  });
});
