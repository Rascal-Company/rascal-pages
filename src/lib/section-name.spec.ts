import { describe, expect, it } from "vitest";
import { sectionDisplayName } from "./section-name";
import type { FluidBlockId, FluidContent } from "./fluid";

const fluid = (content: FluidContent) => ({ type: "fluid" as const, content });

describe("sectionDisplayName", () => {
  it("vanhat osiot tyypin nimellä", () => {
    expect(sectionDisplayName({ type: "faq", content: [] })).toBe("UKK");
  });

  it("navigaationimi ensin", () => {
    expect(sectionDisplayName(fluid({ blocks: [], navLabel: "Palvelut" }))).toBe("Palvelut");
  });

  it("yksittäinen valmis osio sen nimellä", () => {
    expect(
      sectionDisplayName(
        fluid({
          blocks: [
            {
              id: "c" as FluidBlockId,
              type: "component",
              desktop: { x: 0, y: 0, w: 24, h: 12 },
              content: { sectionType: "pricing", data: { plans: [] } as never },
            },
          ],
        }),
      ),
    ).toBe("Hinnoittelu");
  });

  it("ensimmäinen otsikko, lyhennettynä", () => {
    const name = sectionDisplayName(
      fluid({
        blocks: [
          { id: "a" as FluidBlockId, type: "text", desktop: { x: 0, y: 3, w: 6, h: 2 }, content: { variant: "body", text: "Leipä", align: "left" } },
          {
            id: "b" as FluidBlockId,
            type: "text",
            desktop: { x: 0, y: 0, w: 6, h: 2 },
            content: { variant: "h1", text: "Erittäin pitkä otsikko joka ei mahdu listaan kokonaan", align: "left" },
          },
        ],
      }),
    );
    expect(name.startsWith("Erittäin pitkä otsikko")).toBe(true);
    expect(name.endsWith("…")).toBe(true);
  });

  it("tyhjä vapaa osio", () => {
    expect(sectionDisplayName(fluid({ blocks: [] }))).toBe("Vapaa osio");
  });
});
