import { describe, expect, it } from "vitest";
import type { FluidContent } from "./fluid";
import type { BrandContext } from "./overlay-campaign";
import {
  REFERENCE_OUTPUT_SCHEMA,
  buildReferenceSystemPrompt,
  buildReferenceUserPrompt,
  contrastRatio,
  parseReferencePage,
  parseTheme,
  sanitizeSlots,
} from "./reference-page";
import type { ReferenceSkeleton } from "./reference-skeleton";

let counter = 0;
const makeId = () => `id${++counter}`;

const BRAND: BrandContext = {
  companyName: "Acme Oy",
  website: "https://acme.fi",
  industry: "Ohjelmistot",
  language: "suomi",
  companySummary: { mita: "Laskutusohjelmisto" },
  icpSummary: null,
  buyerPersona: null,
  tov: null,
  voiceAnchor: null,
};

const REF: ReferenceSkeleton = {
  url: "https://example.com/",
  title: "Example",
  description: "Kuvaus",
  outline: 'section.hero\n  h1 "Iso otsikko"',
  fonts: ["Inter"],
  colors: ["#ffffff", "#111111"],
  cssVars: { "--primary": "#ff5500" },
  images: ["https://example.com/hero.jpg"],
  stylesheets: [],
};

const RESPONSE = {
  styleSummary: "Ilmava, keskitetty, oranssi korostus.",
  siteTitle: "Acme – laskutus helpoksi",
  metaDescription: "Laskutusohjelmisto pienyrityksille.",
  theme: {
    appearance: "light",
    primaryColor: "#FF5500",
    background: "#ffffff",
    foreground: "#111111",
    muted: "#f4f4f5",
    headingFont: "Space Grotesk",
    bodyFont: "Inter",
    radius: "0.75rem",
  },
  sections: [
    {
      pattern: "hero-split",
      navLabel: "",
      background: "default",
      slots: {
        title: "Laskutus helpoksi",
        body: "Lähetä laskut minuuteissa.",
        primaryLabel: "Kokeile",
        primaryHref: "#ota-yhteytta",
        image: "https://example.com/hero.jpg",
      },
    },
    { pattern: "unknown-pattern", navLabel: "", background: "default", slots: { title: "x" } },
    { pattern: "quote", navLabel: "", background: "default", slots: { quote: "Puuttuu tekijä" } },
    {
      pattern: "features-columns",
      navLabel: "Palvelut",
      background: "muted",
      slots: {
        title: "Miksi Acme",
        items: [
          { title: "Nopea", body: "A" },
          { title: "Selkeä", body: "B" },
          { title: "Edullinen", body: "C" },
        ],
      },
    },
    { pattern: "cta-centered", navLabel: "Ota yhteyttä", background: "default", slots: { title: "Aloita", primaryLabel: "Ota yhteyttä", primaryHref: "javascript:alert(1)" } },
  ],
};

describe("parseReferencePage", () => {
  it("rakentaa sivun, jättää tuntemattomat ja puutteelliset osiot pois ja lisää alapalkin", () => {
    const result = parseReferencePage(JSON.stringify(RESPONSE), new Set(), makeId)!;
    expect(result.siteTitle).toBe("Acme – laskutus helpoksi");
    expect(result.styleSummary).toContain("Ilmava");
    expect(result.content.templateId).toBe("blank");
    expect(result.content.sections.map((s) => s.type)).toEqual(["fluid", "fluid", "fluid", "footer"]);
    expect(result.content.seo).toEqual({
      metaTitle: "Acme – laskutus helpoksi",
      metaDescription: "Laskutusohjelmisto pienyrityksille.",
    });
    expect(result.content.sections[1].style).toEqual({ background: "var(--muted)" });
    expect(result.content.sections[1].content).toMatchObject({ navLabel: "Palvelut", anchor: "palvelut" });
  });

  it("hyväksyy kuvan vain sallitusta listasta", () => {
    const withImage = parseReferencePage(JSON.stringify(RESPONSE), new Set(["https://example.com/hero.jpg"]), makeId)!;
    const withoutImage = parseReferencePage(JSON.stringify(RESPONSE), new Set(), makeId)!;
    const imageOf = (r: typeof withImage) =>
      (r.content.sections[0].content as FluidContent).blocks.find((b) => b.type === "image");
    expect(imageOf(withImage)).toMatchObject({ content: { src: "https://example.com/hero.jpg" } });
    expect(imageOf(withoutImage)).toMatchObject({ content: { src: "" } });
  });

  it("korvaa vaaralliset linkit", () => {
    const result = parseReferencePage(JSON.stringify(RESPONSE), new Set(), makeId)!;
    const cta = (result.content.sections[2].content as FluidContent).blocks.find((b) => b.type === "button");
    expect(cta).toMatchObject({ content: { href: "#" } });
  });

  it("palauttaa null, kun vastaus ei kelpaa", () => {
    expect(parseReferencePage("ei jsonia", new Set(), makeId)).toBeNull();
    expect(parseReferencePage(JSON.stringify({ sections: "x" }), new Set(), makeId)).toBeNull();
    expect(parseReferencePage(JSON.stringify({ ...RESPONSE, sections: RESPONSE.sections.slice(0, 1) }), new Set(), makeId)).toBeNull();
  });
});

describe("parseTheme", () => {
  it("normalisoi värit ja ottaa luettavan paletin", () => {
    const theme = parseTheme(RESPONSE.theme);
    expect(theme).toMatchObject({
      primaryColor: "#ff5500",
      appearance: "light",
      headingFont: "Space Grotesk",
      bodyFont: "Inter",
      radius: "0.75rem",
      palette: { background: "#ffffff", foreground: "#111111", muted: "#f4f4f5" },
    });
  });

  it("hylkää huonon kontrastin, väärän teeman ja tuntemattomat fontit", () => {
    const lowContrast = parseTheme({ ...RESPONSE.theme, foreground: "#eeeeee" });
    expect(lowContrast.palette?.background).toBeUndefined();
    const mismatch = parseTheme({ ...RESPONSE.theme, appearance: "dark" });
    expect(mismatch.palette?.background).toBeUndefined();
    const badFont = parseTheme({ ...RESPONSE.theme, headingFont: "Comic Sans", radius: "3px" });
    expect(badFont.headingFont).toBeUndefined();
    expect(badFont.radius).toBeUndefined();
  });

  it("valitsee painikkeen tekstivärin kontrastin mukaan", () => {
    expect(parseTheme({ primaryColor: "#1d4ed8" }).palette?.primaryForeground).toBe("#ffffff");
    expect(parseTheme({ primaryColor: "#fde047" }).palette?.primaryForeground).toBe("#111111");
  });

  it("käyttää oletusväriä, kun väri puuttuu", () => {
    expect(parseTheme(undefined).primaryColor).toBe("#2563eb");
  });
});

describe("sanitizeSlots", () => {
  it("pudottaa ei-merkkijonot ja lyhentää", () => {
    const slots = sanitizeSlots({ title: 5, body: "  x  ", eyebrow: "y".repeat(100), items: [{ title: "a", value: 3 }] }, new Set());
    expect(slots.title).toBeUndefined();
    expect(slots.body).toBe("x");
    expect(slots.eyebrow).toHaveLength(60);
    expect(slots.items).toEqual([{ title: "a", body: undefined, value: undefined, label: undefined }]);
  });
});

describe("contrastRatio", () => {
  it("musta ja valkoinen on 21:1", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21);
  });
});

describe("prompts", () => {
  it("järjestelmäprompti listaa pohjat ja tekijänoikeussäännön", () => {
    const system = buildReferenceSystemPrompt();
    expect(system).toContain("- hero-split:");
    expect(system).toContain("ÄLÄ kopioi tekstejä");
  });

  it("käyttäjäprompti näyttää kuvat vain oman sivun tilassa", () => {
    const inspiration = buildReferenceUserPrompt(BRAND, { mode: "inspiration", goal: "Liidejä" }, [REF]);
    const own = buildReferenceUserPrompt(BRAND, { mode: "own", goal: "" }, [REF]);
    expect(inspiration).toContain("Tila: inspiration");
    expect(inspiration).toContain('<referenssi numero="1" url="https://example.com/">');
    expect(inspiration).toContain("Acme Oy");
    expect(inspiration).not.toContain("hero.jpg");
    expect(own).toContain("https://example.com/hero.jpg");
    expect(own).toContain("Esittele yritys");
  });

  it("skeeman osioiden pohjat vastaavat rekisteriä", () => {
    expect(REFERENCE_OUTPUT_SCHEMA.properties.sections.items.properties.pattern.enum).toContain("contact-form");
  });
});
