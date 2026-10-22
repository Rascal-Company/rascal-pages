import { describe, expect, it } from "vitest";
import { DESKTOP_COLUMNS, type FluidBlock, type FluidContent } from "./fluid";
import { LAYOUT_PATTERN_IDS, buildPatternSection, describePatterns, textRows, type PatternSlots } from "./layout-patterns";

let counter = 0;
const makeId = () => `id${++counter}`;

const FULL: PatternSlots = {
  eyebrow: "Uutta",
  title: "Parempi tapa tehdä töitä",
  body: "Lyhyt kuvaus siitä, mitä tarjoamme ja kenelle.",
  primaryLabel: "Aloita",
  primaryHref: "#yhteys",
  secondaryLabel: "Lue lisää",
  image: "https://example.com/a.jpg",
  quote: "Paras päätös, jonka teimme.",
  author: "Maija Meikäläinen",
  role: "Toimitusjohtaja",
  items: [
    { title: "Nopea", body: "Käyttöön minuuteissa.", value: "3 min", label: "käyttöönotto" },
    { title: "Turvallinen", body: "Data pysyy EU:ssa.", value: "100 %", label: "EU" },
    { title: "Edullinen", body: "Ei piilokuluja.", value: "0 €", label: "aloitus" },
  ],
};

function blocksOf(pattern: (typeof LAYOUT_PATTERN_IDS)[number], slots: PatternSlots = FULL): FluidBlock[] {
  const section = buildPatternSection({ pattern, slots }, makeId);
  expect(section).not.toBeNull();
  return (section!.content as FluidContent).blocks;
}

function overlaps(a: FluidBlock, b: FluidBlock): boolean {
  const r = a.desktop;
  const s = b.desktop;
  return r.x < s.x + s.w && s.x < r.x + r.w && r.y < s.y + s.h && s.y < r.y + r.h;
}

describe("layout patterns", () => {
  it.each(LAYOUT_PATTERN_IDS)("%s pysyy ruudukossa ilman päällekkäisyyksiä", (pattern) => {
    const blocks = blocksOf(pattern);
    for (const block of blocks) {
      const { x, y, w, h } = block.desktop;
      expect(x).toBeGreaterThanOrEqual(0);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(w).toBeGreaterThan(0);
      expect(h).toBeGreaterThan(0);
      expect(x + w).toBeLessThanOrEqual(DESKTOP_COLUMNS);
    }
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        expect(overlaps(blocks[i], blocks[j]), `${pattern}: ${i} ja ${j} päällekkäin`).toBe(false);
      }
    }
  });

  it("jättää osion pois, kun pakollinen sisältö puuttuu", () => {
    expect(buildPatternSection({ pattern: "hero-centered", slots: {} }, makeId)).toBeNull();
    expect(buildPatternSection({ pattern: "features-columns", slots: { items: [{ title: "Yksi" }] } }, makeId)).toBeNull();
    expect(buildPatternSection({ pattern: "quote", slots: { quote: "Hyvä" } }, makeId)).toBeNull();
    expect(buildPatternSection({ pattern: "nope" as never, slots: FULL }, makeId)).toBeNull();
  });

  it("hero-split: kuva oikealla oletuksena ja vasemmalla pyydettäessä", () => {
    const right = blocksOf("hero-split").find((b) => b.type === "image")!;
    const left = blocksOf("hero-split", { ...FULL, imageSide: "left" }).find((b) => b.type === "image")!;
    expect(right.desktop.x).toBe(13);
    expect(left.desktop.x).toBe(0);
  });

  it("ominaisuudet: neljä kohtaa kahteen sarakkeeseen", () => {
    const four = { ...FULL, items: [...FULL.items!, { title: "Neljäs", body: "Teksti." }] };
    const titles = blocksOf("features-columns", four).filter((b) => b.type === "text" && b.content.variant === "h3");
    expect(new Set(titles.map((b) => b.desktop.x))).toEqual(new Set([0, 14]));
  });

  it("vaiheet numeroidaan", () => {
    const eyebrows = blocksOf("steps")
      .filter((b) => b.type === "text" && b.content.variant === "eyebrow")
      .map((b) => (b.type === "text" ? b.content.text : ""));
    expect(eyebrows).toEqual(["Uutta", "01", "02", "03"]);
  });

  it("UKK, palautteet ja lomake ovat komponenttilohkoja", () => {
    expect(blocksOf("faq")[0]).toMatchObject({ type: "component", content: { sectionType: "faq" } });
    expect(blocksOf("testimonials")[0]).toMatchObject({ type: "component", content: { sectionType: "testimonials" } });
    expect(blocksOf("contact-form")[0]).toMatchObject({
      type: "component",
      content: { sectionType: "form", data: { formTitle: "Parempi tapa tehdä töitä", submitButtonText: "Aloita" } },
    });
  });

  it("navigaationimi tuottaa ankkurin ja tausta tyylin", () => {
    const section = buildPatternSection(
      { pattern: "cta-centered", slots: FULL, navLabel: "Ota yhteyttä", background: "muted" },
      makeId,
    )!;
    expect(section.content).toMatchObject({ navLabel: "Ota yhteyttä", anchor: "ota-yhteytta" });
    expect(section.style).toEqual({ background: "var(--muted)" });
  });

  it("kuvaus listaa kaikki pohjat", () => {
    const text = describePatterns();
    for (const id of LAYOUT_PATTERN_IDS) expect(text).toContain(`- ${id}:`);
  });
});

describe("textRows", () => {
  it("kasvaa tekstin pituuden mukana ja kapenevan sarakkeen myötä", () => {
    expect(textRows("Lyhyt", "body", 12)).toBe(2);
    expect(textRows("x".repeat(400), "body", 12)).toBeGreaterThan(textRows("x".repeat(100), "body", 12));
    expect(textRows("x".repeat(100), "body", 6)).toBeGreaterThan(textRows("x".repeat(100), "body", 18));
  });
});
