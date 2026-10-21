import { SECTION_TYPE_LABELS, type Section } from "./templates";
import { readingOrder, type FluidContent } from "./fluid";

const HEADING_VARIANTS = new Set(["display", "h1", "h2", "h3"]);

/**
 * Osion nimi editorin listoihin. Vapaalle osiolle: navigaationimi, yksittäisen
 * valmiin osion nimi tai ensimmäinen otsikko — ei geneeristä "Vapaa osio".
 */
export function sectionDisplayName(section: Pick<Section, "type" | "content">): string {
  if (section.type !== "fluid") return SECTION_TYPE_LABELS[section.type];
  const content = section.content as FluidContent;
  if (content.navLabel?.trim()) return content.navLabel.trim();

  const blocks = readingOrder(content.blocks ?? []);
  if (blocks.length === 1 && blocks[0].type === "component") {
    return SECTION_TYPE_LABELS[blocks[0].content.sectionType];
  }
  const heading = blocks.find((b) => b.type === "text" && HEADING_VARIANTS.has(b.content.variant));
  const firstText = heading ?? blocks.find((b) => b.type === "text");
  if (firstText?.type === "text" && firstText.content.text.trim()) {
    const value = firstText.content.text.trim().replace(/\s+/g, " ");
    return value.length > 36 ? `${value.slice(0, 35)}…` : value;
  }
  return SECTION_TYPE_LABELS.fluid;
}
