import { describe, expect, it } from "vitest";
import {
  DESKTOP_COLUMNS,
  MOBILE_COLUMNS,
  autoMobileLayout,
  clampRect,
  defaultFluidContent,
  materializeMobile,
  moveRect,
  newBlock,
  newComponentBlock,
  slugifyAnchor,
  readingOrder,
  rectFor,
  resizeRect,
  rowCount,
  type FluidBlock,
  type FluidBlockId,
} from "./fluid";

const text = (id: string, x: number, y: number, w = 6, h = 2): FluidBlock => ({
  id: id as FluidBlockId,
  type: "text",
  desktop: { x, y, w, h },
  content: { variant: "body", text: id, align: "left" },
});

describe("clampRect / moveRect", () => {
  it("pitää lohkon ruudukossa", () => {
    expect(clampRect({ x: 22, y: -3, w: 6, h: 0 }, 24)).toEqual({ x: 18, y: 0, w: 6, h: 1 });
    expect(clampRect({ x: 0, y: 0, w: 40, h: 2 }, 24)).toEqual({ x: 0, y: 0, w: 24, h: 2 });
  });

  it("siirtää ja pyöristää", () => {
    expect(moveRect({ x: 2, y: 2, w: 4, h: 2 }, 3.4, -1.6, 24)).toEqual({ x: 5, y: 0, w: 4, h: 2 });
    expect(moveRect({ x: 20, y: 0, w: 4, h: 2 }, 5, 0, 24).x).toBe(20);
  });
});

describe("resizeRect", () => {
  const rect = { x: 4, y: 4, w: 6, h: 4 };

  it("itä ja etelä kasvattavat", () => {
    expect(resizeRect(rect, "se", 2, 3, 24)).toEqual({ x: 4, y: 4, w: 8, h: 7 });
  });

  it("länsi ja pohjoinen pitävät vastakkaisen reunan paikallaan", () => {
    expect(resizeRect(rect, "nw", -2, -1, 24)).toEqual({ x: 2, y: 3, w: 8, h: 5 });
    expect(resizeRect(rect, "w", 10, 0, 24)).toEqual({ x: 9, y: 4, w: 1, h: 4 });
  });

  it("ei mene reunan yli", () => {
    expect(resizeRect(rect, "e", 100, 0, 24).w).toBe(20);
    expect(resizeRect(rect, "n", 0, -100, 24)).toEqual({ x: 4, y: 0, w: 6, h: 8 });
  });
});

describe("mobiiliasettelu", () => {
  const blocks = [text("b", 12, 0), text("a", 0, 0), text("c", 0, 5, 6, 3)];

  it("lukujärjestys ylhäältä alas, vasemmalta oikealle", () => {
    expect(readingOrder(blocks).map((b) => b.id)).toEqual(["a", "b", "c"]);
  });

  it("pinoaa täysleveinä väleillä", () => {
    const auto = autoMobileLayout(blocks);
    expect(auto.get("a")).toEqual({ x: 0, y: 0, w: MOBILE_COLUMNS, h: 2 });
    expect(auto.get("b")).toEqual({ x: 0, y: 3, w: MOBILE_COLUMNS, h: 2 });
    expect(auto.get("c")).toEqual({ x: 0, y: 6, w: MOBILE_COLUMNS, h: 3 });
  });

  it("käyttää omaa mobiilisijaintia, jos sellainen on", () => {
    const own = { ...text("x", 0, 0), mobile: { x: 2, y: 9, w: 4, h: 2 } };
    expect(rectFor(own, "mobile", autoMobileLayout([own]))).toEqual({ x: 2, y: 9, w: 4, h: 2 });
    expect(rectFor(own, "desktop", new Map())).toEqual(own.desktop);
  });

  it("materializeMobile antaa kaikille oman sijainnin", () => {
    const result = materializeMobile(blocks);
    expect(result.every((b) => b.mobile)).toBe(true);
    expect(materializeMobile(result)).toBe(result);
  });
});

describe("newBlock / rowCount", () => {
  it("lisää lohkon alimman alle", () => {
    const blocks = [text("a", 0, 0, 6, 4), text("b", 6, 2, 6, 5)];
    expect(rowCount(blocks.map((b) => b.desktop))).toBe(7);
    const added = newBlock("image", "img", blocks);
    expect(added.desktop.y).toBe(7);
    expect(added.mobile).toBeUndefined();
  });

  it("tekstilohko saa annetun tyylin", () => {
    const added = newBlock("text", "t", [], { variant: "h2", text: "Otsikko" });
    expect(added.type === "text" && added.content).toMatchObject({ variant: "h2", text: "Otsikko" });
  });

  it("aloitussisältö mahtuu ruudukkoon", () => {
    let n = 0;
    const content = defaultFluidContent(() => `id${n++}`);
    for (const block of content.blocks) {
      expect(block.desktop.x + block.desktop.w).toBeLessThanOrEqual(DESKTOP_COLUMNS);
    }
    expect(new Set(content.blocks.map((b) => b.id)).size).toBe(content.blocks.length);
  });
});

describe("komponenttilohko ja ankkurit", () => {
  it("valmis osio täysleveäksi lohkoksi alimman alle", () => {
    const block = newComponentBlock("faq", [{ question: "K?", answer: "V." }], "c", [text("a", 0, 0, 6, 4)]);
    expect(block.type).toBe("component");
    expect(block.desktop).toEqual({ x: 0, y: 4, w: DESKTOP_COLUMNS, h: 12 });
  });

  it("ankkuri nimestä ilman ääkkösiä ja erikoismerkkejä", () => {
    expect(slugifyAnchor("Meistä & tiimi")).toBe("meista-tiimi");
    expect(slugifyAnchor("  Ota yhteyttä! ")).toBe("ota-yhteytta");
  });
});
