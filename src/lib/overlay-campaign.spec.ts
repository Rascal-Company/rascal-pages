import { describe, expect, it } from "vitest";
import {
  buildChanges,
  buildCopySystemPrompt,
  buildCopyUserPrompt,
  parseGeneratedTexts,
  parseSlots,
  parseSlotValues,
  type BrandContext,
  type OverlaySlot,
} from "./overlay-campaign";

const rawSlots = [
  { id: "s1", label: "Pääotsikko", selector: "h1 > span", type: "text", original: "Tuotteita" },
  { id: "s2", label: "CTA", selector: "a.btn", type: "link", original: "/yhteys" },
  { id: "s3", label: "Banneri", selector: "#banner", type: "hide", original: "div" },
  { id: "s4", label: "Hero", selector: "img", type: "image", original: "/a.jpg" },
];

function slots(): OverlaySlot[] {
  const parsed = parseSlots(rawSlots);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.slots;
}

describe("parseSlots", () => {
  it("hyväksyy validit slotit", () => {
    expect(slots()).toHaveLength(4);
  });

  it("vaatii nimen, tunnetun tyypin ja uniikit id:t", () => {
    expect(parseSlots([{ ...rawSlots[0], label: " " }]).ok).toBe(false);
    expect(parseSlots([{ ...rawSlots[0], type: "html" }]).ok).toBe(false);
    expect(parseSlots([rawSlots[0], rawSlots[0]]).ok).toBe(false);
    expect(parseSlots([{ ...rawSlots[0], selector: "" }]).ok).toBe(false);
  });
});

describe("parseSlotValues", () => {
  it("pudottaa tuntemattomat slotit ja ei-merkkijonot", () => {
    expect(parseSlotValues({ s1: "Hei", s9: "x", s2: 5 }, slots())).toEqual({ s1: "Hei" });
  });
});

describe("buildChanges", () => {
  it("tekee muutokset vain täytetyille ja muuttuneille sloteille", () => {
    const result = buildChanges(slots(), {
      s1: "Uusi otsikko",
      s2: "/yhteys",
      s3: "1",
      s4: "",
    });
    expect(result.ok && result.changes.map((c) => [c.id, c.type, c.value])).toEqual([
      ["s1", "text", "Uusi otsikko"],
      ["s3", "hide", ""],
    ]);
  });

  it("palauttaa virheellisen slotin nimen", () => {
    const result = buildChanges(slots(), { s1: "Ok", s2: "javascript:alert(1)" });
    expect(result.ok).toBe(false);
    expect(!result.ok && result.error).toContain("CTA");
  });
});

describe("AI-kehotteet", () => {
  const brand: BrandContext = {
    companyName: "Asiakas Oy",
    website: "https://asiakas.fi",
    industry: "Rakentaminen",
    language: null,
    companySummary: { what: "Betonityöt" },
    icpSummary: {},
    buyerPersona: null,
    tov: { style: "Suora" },
    voiceAnchor: null,
  };

  it("sisältää brändin ja jättää tyhjät osiot pois", () => {
    const prompt = buildCopySystemPrompt(brand);
    expect(prompt).toContain("Asiakas Oy");
    expect(prompt).toContain('"style": "Suora"');
    expect(prompt).toContain("Kirjoita kielellä: suomi");
    expect(prompt).not.toContain("<ihanneasiakas>");
    expect(prompt).not.toContain("<ostajapersoona>");
  });

  it("antaa vain tekstislotit", () => {
    const prompt = buildCopyUserPrompt(
      { profile: { name: "Rakentajat", description: "Työmaat" }, angle: "Selkeämpi" },
      slots(),
    );
    expect(prompt).toContain("id: s1");
    expect(prompt).not.toContain("id: s2");
    expect(prompt).toContain("Rakentajat");
    expect(prompt).toContain("<variaation_kulma>\nSelkeämpi");
  });

  it("toimii ilman profiilia ja kulmaa", () => {
    const prompt = buildCopyUserPrompt({ profile: null, angle: "" }, slots());
    expect(prompt).toContain("ihanneasiakkaalle");
    expect(prompt).not.toContain("<variaation_kulma>");
  });
});

describe("parseGeneratedTexts", () => {
  it("poimii vain tunnetut tekstislotit", () => {
    const raw = JSON.stringify({
      texts: [
        { id: "s1", text: " Betonia työmaallesi " },
        { id: "s2", text: "/hack" },
        { id: "x", text: "y" },
        { id: "s1b", text: "" },
      ],
    });
    expect(parseGeneratedTexts(raw, slots())).toEqual({ s1: "Betonia työmaallesi" });
  });

  it("palauttaa tyhjän rikkinäisestä vastauksesta", () => {
    expect(parseGeneratedTexts("ei json", slots())).toEqual({});
    expect(parseGeneratedTexts("{}", slots())).toEqual({});
  });
});
