import { describe, expect, it } from "vitest";
import { createOverlayVariantId } from "./overlay";
import { createPreviewToken, verifyPreviewToken } from "./overlay-token";

const id = createOverlayVariantId("4d395647-ead4-4b29-a31d-5689c93d2dbf");

describe("preview token", () => {
  it("palauttaa variantin id:n oikealla avaimella", () => {
    expect(verifyPreviewToken(createPreviewToken(id, "salainen"), "salainen")).toBe(id);
  });

  it("hylkää väärän avaimen, muokatun id:n ja roskan", () => {
    const token = createPreviewToken(id, "salainen");
    expect(verifyPreviewToken(token, "toinen")).toBeNull();
    expect(
      verifyPreviewToken(token.replace("4d395647", "00000000"), "salainen"),
    ).toBeNull();
    expect(verifyPreviewToken(`${token}.x`, "salainen")).toBeNull();
    expect(verifyPreviewToken("roskaa", "salainen")).toBeNull();
    expect(verifyPreviewToken("", "salainen")).toBeNull();
  });
});
