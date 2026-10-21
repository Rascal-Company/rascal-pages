import { describe, expect, it } from "vitest";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config } from "./proxy";

const matches = (url: string) => unstable_doesMiddlewareMatch({ config, url });

describe("proxy matcher", () => {
  it("ei koske overlay-snippetiin, jotta se latautuu kaikilta hosteilta", () => {
    expect(matches("/overlay/o.js")).toBe(false);
  });

  it("ei koske API-reitteihin eikä juuritason tiedostoihin", () => {
    expect(matches("/api/overlay/config")).toBe(false);
    expect(matches("/favicon.ico")).toBe(false);
  });

  it("käsittelee sivupolut, myös overlay-nimiset", () => {
    expect(matches("/")).toBe(true);
    expect(matches("/overlay")).toBe(true);
    expect(matches("/dashboard/abc/overlay")).toBe(true);
  });
});
