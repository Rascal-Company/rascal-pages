import { describe, expect, test } from "vitest";
import { buildDomainPayload, buildProjectPayload } from "./vercel";

describe("buildProjectPayload", () => {
  test("links a nextjs project to the github repo", () => {
    const payload = buildProjectPayload({
      name: "rascal-site-x",
      repoFullName: "rascal-sites/rascal-site-x",
    });

    expect(payload).toEqual({
      name: "rascal-site-x",
      framework: "nextjs",
      gitRepository: { type: "github", repo: "rascal-sites/rascal-site-x" },
    });
  });

  test("maps env vars to production + preview targets", () => {
    const payload = buildProjectPayload({
      name: "n",
      repoFullName: "o/n",
      env: { SITE_CENTRAL_API: "https://api.example.com" },
    }) as { environmentVariables: unknown[] };

    expect(payload.environmentVariables).toEqual([
      {
        key: "SITE_CENTRAL_API",
        value: "https://api.example.com",
        type: "plain",
        target: ["production", "preview"],
      },
    ]);
  });
});

describe("buildDomainPayload", () => {
  test("wraps the domain name", () => {
    expect(buildDomainPayload("samikiias.rascalpages.fi")).toEqual({
      name: "samikiias.rascalpages.fi",
    });
  });
});
