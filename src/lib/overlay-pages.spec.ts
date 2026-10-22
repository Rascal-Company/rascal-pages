import { describe, expect, it } from "vitest";
import type { FluidBlock, FluidBlockId, FluidContent } from "./fluid";
import type { OverlayChange, OverlayChangeId } from "./overlay";
import { applyOverlayChanges, blockIdFromSelector, pagesSiteOrigins } from "./overlay-pages";
import { readMatchParams } from "./overlay-pages-server";
import type { SectionId, TemplateConfig } from "./templates";

const rect = { x: 0, y: 0, w: 12, h: 2 };
const id = (value: string) => value as FluidBlockId;

const BLOCKS: FluidBlock[] = [
  { id: id("title"), type: "text", desktop: rect, content: { variant: "h1", text: "Parempi  tapa", align: "left" } },
  { id: id("hero"), type: "image", desktop: rect, content: { src: "/a.jpg", alt: "", fit: "cover", radius: 0 } },
  {
    id: id("cta"),
    type: "button",
    desktop: rect,
    content: { label: "Varaa demo", href: "#yhteys", variant: "primary", align: "left" },
  },
];

function page(blocks: FluidBlock[] = BLOCKS): TemplateConfig {
  return {
    templateId: "blank",
    theme: { primaryColor: "#000" } as TemplateConfig["theme"],
    sections: [
      {
        id: "s1" as SectionId,
        type: "fluid",
        isVisible: true,
        content: { blocks } satisfies FluidContent,
      },
    ],
  };
}

function change(selector: string, type: OverlayChange["type"], value: string, original: string): OverlayChange {
  return { id: `c-${selector}-${type}` as OverlayChangeId, selector, type, value, original };
}

function blocksOf(content: TemplateConfig): FluidBlock[] {
  return (content.sections[0].content as FluidContent).blocks;
}

describe("pagesSiteOrigins", () => {
  it("custom domain ensin, sitten subdomain", () => {
    expect(pagesSiteOrigins({ subdomain: "acme", custom_domain: "acme.fi" }, "rascalpages.fi")).toEqual([
      "https://acme.fi",
      "https://acme.rascalpages.fi",
    ]);
    expect(pagesSiteOrigins({ subdomain: "acme", custom_domain: null }, "rascalpages.fi")).toEqual([
      "https://acme.rascalpages.fi",
    ]);
  });
});

describe("blockIdFromSelector", () => {
  it("tunnistaa lohkoon ankkuroidun selektorin", () => {
    expect(blockIdFromSelector('[data-rp-block="cta"] > div > a')).toBe("cta");
    expect(blockIdFromSelector("#top > h1")).toBeNull();
  });
});

describe("applyOverlayChanges", () => {
  it("vaihtaa tekstin, kuvan ja painikkeen", () => {
    const { content, unapplied } = applyOverlayChanges(page(), [
      change('[data-rp-block="title"] > h1:nth-of-type(1)', "text", "Kirjanpito helpoksi", "Parempi tapa"),
      change('[data-rp-block="hero"] > img:nth-of-type(1)', "image", "/b.jpg", "/a.jpg"),
      change('[data-rp-block="cta"] > div > a', "text", "Varaa kartoitus", "Varaa demo"),
      change('[data-rp-block="cta"] > div > a', "link", "https://x.fi", "#yhteys"),
    ]);
    const [title, hero, cta] = blocksOf(content);
    expect(title.type === "text" && title.content.text).toBe("Kirjanpito helpoksi");
    expect(hero.type === "image" && hero.content.src).toBe("/b.jpg");
    expect(cta.type === "button" && cta.content).toMatchObject({ label: "Varaa kartoitus", href: "https://x.fi" });
    expect(unapplied).toEqual([]);
  });

  it("piilottaa koko lohkon vain, kun valittu elementti on lohko", () => {
    const { content, unapplied } = applyOverlayChanges(page(), [
      change('[data-rp-block="hero"]', "hide", "1", "div"),
      change('[data-rp-block="cta"] > div > a', "hide", "1", "a"),
    ]);
    expect(blocksOf(content).map((b) => b.id)).toEqual(["title", "cta"]);
    expect(unapplied.map((c) => c.type)).toEqual(["hide"]);
  });

  it("ohittaa muutoksen, jonka sormenjälki ei täsmää, ja antaa sen selaimelle", () => {
    const stale = change('[data-rp-block="title"] > h1', "text", "Uusi", "Vanha otsikko");
    const { content, unapplied } = applyOverlayChanges(page(), [stale]);
    expect(blocksOf(content)[0]).toEqual(BLOCKS[0]);
    expect(unapplied).toEqual([stale]);
  });

  it("palauttaa muut kuin lohkomuutokset ja tuntemattomat lohkot selaimelle", () => {
    const footer = change("footer > p", "text", "x", "y");
    const missing = change('[data-rp-block="poistettu"] > p', "text", "x", "y");
    const result = applyOverlayChanges(page(), [footer, missing]);
    expect(result.unapplied).toEqual([footer, missing]);
  });

  it("ei muuta alkuperäistä sisältöä", () => {
    const original = page();
    applyOverlayChanges(original, [change('[data-rp-block="hero"]', "hide", "1", "div")]);
    expect(blocksOf(original)).toHaveLength(3);
  });
});

describe("readMatchParams", () => {
  it("URL voittaa evästeen", () => {
    expect(readMatchParams({ rp: "k7f2a", foo: "x" }, '{"rp":"vanha"}')).toEqual({ rp: "k7f2a" });
  });

  it("käyttää evästettä, kun URL:ssa ei ole parametreja", () => {
    expect(readMatchParams({}, '{"utm_term":"kirjanpito"}')).toEqual({ utm_term: "kirjanpito" });
    expect(readMatchParams({}, "rikki")).toEqual({});
    expect(readMatchParams({}, undefined)).toEqual({});
  });
});
