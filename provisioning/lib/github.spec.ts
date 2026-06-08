import { describe, expect, test } from "vitest";
import { buildContentsPutPayload, buildGenerateRepoPayload } from "./github";

describe("buildGenerateRepoPayload", () => {
  test("defaults to a private repo for the given owner/name", () => {
    expect(
      buildGenerateRepoPayload({ owner: "rascal-sites", name: "rascal-site-x" }),
    ).toEqual({
      owner: "rascal-sites",
      name: "rascal-site-x",
      private: true,
      include_all_branches: false,
    });
  });

  test("allows a public repo when requested", () => {
    expect(
      buildGenerateRepoPayload({ owner: "o", name: "n", private: false }).private,
    ).toBe(false);
  });
});

describe("buildContentsPutPayload", () => {
  test("base64-encodes the content and keeps the message", () => {
    const payload = buildContentsPutPayload("hello", "seed: x");

    expect(payload).toEqual({
      message: "seed: x",
      content: Buffer.from("hello", "utf8").toString("base64"),
    });
  });

  test("round-trips utf8 content through base64", () => {
    const content = "Hei, älä unohda ääkkösiä!";
    const decoded = Buffer.from(
      buildContentsPutPayload(content, "m").content as string,
      "base64",
    ).toString("utf8");

    expect(decoded).toBe(content);
  });
});
