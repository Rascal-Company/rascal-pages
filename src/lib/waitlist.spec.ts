import { describe, expect, it } from "vitest";
import {
  REFERRAL_JUMP,
  generateReferralCode,
  normalizeEmail,
  parseReferralCode,
  queuePosition,
  referralCodeFromBytes,
  waitlistShareUrl,
} from "./waitlist";

describe("normalizeEmail", () => {
  it("trimmaa ja pienentää kirjaimet", () => {
    expect(normalizeEmail("  Matti.Meikalainen@Yritys.FI ")).toBe("matti.meikalainen@yritys.fi");
  });

  it.each(["", "   ", "matti", "matti@", "@yritys.fi", "matti@yritys", "ma tti@yritys.fi"])(
    "hylkää virheellisen osoitteen %j",
    (raw) => {
      expect(normalizeEmail(raw)).toBeNull();
    },
  );

  it("hylkää liian pitkän osoitteen", () => {
    expect(normalizeEmail(`${"a".repeat(250)}@x.fi`)).toBeNull();
  });
});

describe("referralCodeFromBytes", () => {
  it("tuottaa 8-merkkisen koodin ilman sekoittuvia merkkejä", () => {
    const code = referralCodeFromBytes(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]));
    expect(code).toBe("ABCDEFGH");
  });

  it("käärii tavut aakkoston ympäri", () => {
    const code = referralCodeFromBytes(new Uint8Array(8).fill(255));
    expect(code).toMatch(/^[A-HJ-KM-NP-Z2-9]{8}$/);
    expect(code).not.toMatch(/[01OIL]/);
  });

  it("vaatii vähintään 8 tavua", () => {
    expect(() => referralCodeFromBytes(new Uint8Array(4))).toThrow();
  });
});

describe("generateReferralCode", () => {
  it("palauttaa koodin, jonka parseReferralCode hyväksyy", () => {
    const code = generateReferralCode();
    expect(parseReferralCode(code)).toBe(code);
  });
});

describe("parseReferralCode", () => {
  it("hyväksyy kelvollisen koodin ja normalisoi kirjainkoon", () => {
    expect(parseReferralCode(" abcdefgh ")).toBe("ABCDEFGH");
  });

  it.each([null, undefined, "", "ABC", "ABCDEFGHJ", "ABCDEFG0", "ABCD-FGH"])(
    "hylkää %j",
    (raw) => {
      expect(parseReferralCode(raw)).toBeNull();
    },
  );
});

describe("queuePosition", () => {
  it("ilman kutsuja sija on ilmoittautumisjärjestys", () => {
    expect(queuePosition(42, 0)).toBe(42);
  });

  it("jokainen kutsu nostaa REFERRAL_JUMP sijaa", () => {
    expect(queuePosition(42, 2)).toBe(42 - 2 * REFERRAL_JUMP);
  });

  it("sija ei mene alle ykkösen", () => {
    expect(queuePosition(3, 10)).toBe(1);
  });
});

describe("waitlistShareUrl", () => {
  it("muodostaa jakolinkin etusivulle", () => {
    expect(waitlistShareUrl(referralCodeFromBytes(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])), "rascalpages.fi")).toBe(
      "https://rascalpages.fi/?ref=ABCDEFGH",
    );
  });
});
