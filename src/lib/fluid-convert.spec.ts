import { describe, expect, it } from "vitest";
import { convertPageToFluid, convertSection } from "./fluid-convert";
import { DESKTOP_COLUMNS, type FluidContent } from "./fluid";
import type { Section, TemplateConfig } from "./templates";
import type { SectionId } from "./types";

function ids() {
  let n = 0;
  return () => `b${n++}`;
}

const section = <T extends Section["type"]>(type: T, content: Section<T>["content"], extra: Partial<Section> = {}) =>
  ({ id: `s-${type}` as SectionId, type, content, isVisible: true, ...extra }) as Section;

function blocksOf(s: Section) {
  expect(s.type).toBe("fluid");
  return (s.content as FluidContent).blocks;
}

describe("convertSection", () => {
  it("pääosio ilman kuvaa: keskitetyt teksti- ja painikelohkot", () => {
    const blocks = blocksOf(
      convertSection(
        section("hero", { title: "Otsikko", subtitle: "Ala", ctaText: "Osta", ctaLink: "/osta", eyebrow: "Uutta" }),
        ids(),
      ),
    );
    expect(blocks.map((b) => b.type)).toEqual(["text", "text", "text", "button"]);
    const title = blocks[1];
    expect(title.type === "text" && title.content).toMatchObject({ variant: "display", align: "center" });
    const cta = blocks[3];
    expect(cta.type === "button" && cta.content.href).toBe("/osta");
    // Pinossa ei päällekkäisyyksiä.
    for (let i = 1; i < blocks.length; i++) {
      expect(blocks[i].desktop.y).toBeGreaterThanOrEqual(blocks[i - 1].desktop.y + blocks[i - 1].desktop.h);
    }
  });

  it("pääosio kuvalla: teksti vasemmalle, kuva oikealle", () => {
    const blocks = blocksOf(
      convertSection(section("hero", { title: "T", subtitle: "", ctaText: "", ctaLink: "", image: "/k.jpg" }), ids()),
    );
    const img = blocks.find((b) => b.type === "image")!;
    expect(img.desktop.x).toBe(13);
    expect(blocks[0].desktop.x + blocks[0].desktop.w).toBeLessThanOrEqual(12);
  });

  it("pääosio upotetulla lomakkeella säilyy kokonaisena", () => {
    const blocks = blocksOf(
      convertSection(section("hero", { title: "T", subtitle: "", ctaText: "", ctaLink: "", showForm: true }), ids()),
    );
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type === "component" && blocks[0].content.sectionType).toBe("hero");
  });

  it("CTA kahdella painikkeella", () => {
    const blocks = blocksOf(
      convertSection(
        section("cta", { heading: "H", text: "T", primaryCtaText: "A", primaryCtaLink: "/a", secondaryCtaText: "B" }),
        ids(),
      ),
    );
    expect(blocks.filter((b) => b.type === "button")).toHaveLength(2);
  });

  it("UKK komponenttilohkoksi täydelle leveydelle", () => {
    const faq = [{ question: "K", answer: "V" }];
    const blocks = blocksOf(convertSection(section("faq", faq), ids()));
    expect(blocks[0]).toMatchObject({ type: "component", desktop: { w: DESKTOP_COLUMNS } });
    expect(blocks[0].type === "component" && blocks[0].content.data).toBe(faq);
  });

  it("säilyttää tunnisteen, näkyvyyden ja tyylin; lisää navigaation", () => {
    const converted = convertSection(
      section("about", { name: "N", bio: "B" }, { isVisible: false, style: { paddingY: "lg" } }),
      ids(),
    );
    expect(converted).toMatchObject({ id: "s-about", isVisible: false, style: { paddingY: "lg" } });
    expect(converted.content).toMatchObject({ anchor: "tarina", navLabel: "Tarina" });
  });

  it("lomake on navigaation CTA", () => {
    const converted = convertSection(section("form", { fields: [] }), ids());
    expect(converted.content).toMatchObject({ anchor: "yhteys", navStyle: "cta" });
  });

  it("portfoliopohjassa osiot säilyvät kokonaisina", () => {
    const blocks = blocksOf(convertSection(section("about", { name: "N", bio: "B" }), ids(), "portfolio"));
    expect(blocks).toHaveLength(1);
    expect(blocks[0].type).toBe("component");
  });

  it("alapalkki ja vapaa osio ennallaan", () => {
    const footer = section("footer", { text: "©" } as never);
    expect(convertSection(footer, ids())).toBe(footer);
  });
});

describe("convertPageToFluid", () => {
  it("muuntaa kaikki osiot ja on idempotentti", () => {
    const page = {
      templateId: "saas-modern",
      theme: { primaryColor: "#000" },
      sections: [
        section("hero", { title: "T", subtitle: "S", ctaText: "C", ctaLink: "#" }),
        section("faq", [{ question: "K", answer: "V" }]),
        section("footer", { text: "©" } as never),
      ],
    } as TemplateConfig;
    const converted = convertPageToFluid(page, ids());
    expect(converted.sections.map((s) => s.type)).toEqual(["fluid", "fluid", "footer"]);
    expect(convertPageToFluid(converted, ids())).toBe(converted);
  });
});
