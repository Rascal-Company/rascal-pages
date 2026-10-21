/**
 * Vanhan osiomallin muunnos vapaiksi osioiksi (Fluid). Tekstivetoiset osiot
 * (pääosio, tietoa, toimintakehote) puretaan oikeiksi teksti-, kuva- ja
 * painikelohkoiksi; monimutkaiset osiot (lomake, UKK, hinnoittelu…) säilyvät
 * kokonaisina komponenttilohkoina. Alapalkki pysyy globaalina osiona.
 */
import type {
  AboutContent,
  CasesContent,
  CtaContent,
  HeroContent,
  Section,
  SectionContentMap,
  TechStackContent,
  TemplateConfig,
} from "./templates";
import {
  DESKTOP_COLUMNS,
  type ComponentSectionType,
  type FluidBlock,
  type FluidBlockId,
  type FluidContent,
  type FluidRect,
  type TextVariant,
  type FluidAlign,
} from "./fluid";

type MakeId = () => string;

function text(
  makeId: MakeId,
  desktop: FluidRect,
  variant: TextVariant,
  value: string,
  align: FluidAlign = "left",
): FluidBlock {
  return { id: makeId() as FluidBlockId, type: "text", desktop, content: { variant, text: value, align } };
}

function image(makeId: MakeId, desktop: FluidRect, src: string, alt: string): FluidBlock {
  return { id: makeId() as FluidBlockId, type: "image", desktop, content: { src, alt, fit: "cover", radius: 16 } };
}

function button(
  makeId: MakeId,
  desktop: FluidRect,
  label: string,
  href: string,
  variant: "primary" | "secondary" = "primary",
  align: FluidAlign = "left",
): FluidBlock {
  return {
    id: makeId() as FluidBlockId,
    type: "button",
    desktop,
    content: { label, href: href || "#", variant, align },
  };
}

function component(
  makeId: MakeId,
  sectionType: ComponentSectionType,
  data: SectionContentMap[ComponentSectionType],
): FluidBlock {
  return {
    id: makeId() as FluidBlockId,
    type: "component",
    desktop: { x: 0, y: 0, w: DESKTOP_COLUMNS, h: 12 },
    content: { sectionType, data },
  };
}

/** Pystysuuntainen pino: jokainen lohko alkaa edellisen alta välin jälkeen. */
function stack(items: { rect: Omit<FluidRect, "y">; make: (rect: FluidRect) => FluidBlock }[], startY = 0, gap = 1) {
  const blocks: FluidBlock[] = [];
  let y = startY;
  for (const item of items) {
    const rect = { ...item.rect, y };
    blocks.push(item.make(rect));
    y += item.rect.h + gap;
  }
  return { blocks, bottom: y };
}

export function convertHero(content: HeroContent, makeId: MakeId): FluidBlock[] {
  const centered = content.layout !== "left";
  const hasImage = Boolean(content.image?.trim());
  const align: FluidAlign = centered && !hasImage ? "center" : "left";

  type Item = Parameters<typeof stack>[0][number];
  const items: Item[] = [];
  const col = centered && !hasImage ? { x: 3, w: 18 } : { x: 0, w: hasImage ? 12 : 16 };

  if (content.eyebrow?.trim()) {
    items.push({ rect: { ...col, h: 1 }, make: (r) => text(makeId, r, "eyebrow", content.eyebrow!, align) });
  }
  items.push({ rect: { ...col, h: 4 }, make: (r) => text(makeId, r, "display", content.title, align) });
  if (content.subtitle?.trim()) {
    items.push({ rect: { ...col, h: 2 }, make: (r) => text(makeId, r, "body", content.subtitle, align) });
  }
  if (content.ctaText?.trim()) {
    const buttonCol = align === "center" ? { x: 9, w: 6 } : { x: col.x, w: 6 };
    items.push({
      rect: { ...buttonCol, h: 2 },
      make: (r) => button(makeId, r, content.ctaText, content.ctaLink, "primary", align),
    });
  }

  const { blocks, bottom } = stack(items);
  if (hasImage) {
    blocks.push(image(makeId, { x: 13, y: 0, w: 11, h: Math.max(14, bottom) }, content.image!, content.title));
  }
  return blocks;
}

export function convertAbout(content: AboutContent, makeId: MakeId): FluidBlock[] {
  const hasImage = Boolean(content.image?.trim());
  const col = hasImage ? { x: 12, w: 12 } : { x: 3, w: 18 };
  const { blocks, bottom } = stack([
    { rect: { ...col, h: 3 }, make: (r) => text(makeId, r, "h2", content.name) },
    { rect: { ...col, h: 6 }, make: (r) => text(makeId, r, "body", content.bio) },
  ]);
  if (hasImage) {
    blocks.unshift(image(makeId, { x: 0, y: 0, w: 10, h: Math.max(14, bottom) }, content.image!, content.name));
  }
  return blocks;
}

export function convertCta(content: CtaContent, makeId: MakeId): FluidBlock[] {
  type Item = Parameters<typeof stack>[0][number];
  const items: Item[] = [
    { rect: { x: 3, w: 18, h: 3 }, make: (r) => text(makeId, r, "h2", content.heading, "center") },
  ];
  if (content.text?.trim()) {
    items.push({ rect: { x: 4, w: 16, h: 3 }, make: (r) => text(makeId, r, "body", content.text!, "center") });
  }
  const { blocks, bottom } = stack(items);
  const primary = content.primaryCtaText?.trim();
  const secondary = content.secondaryCtaText?.trim();
  if (primary && secondary) {
    blocks.push(button(makeId, { x: 6, y: bottom, w: 6, h: 2 }, primary, content.primaryCtaLink ?? "#", "primary", "right"));
    blocks.push(button(makeId, { x: 12, y: bottom, w: 6, h: 2 }, secondary, content.secondaryCtaLink ?? "#", "secondary", "left"));
  } else if (primary || secondary) {
    blocks.push(
      button(
        makeId,
        { x: 9, y: bottom, w: 6, h: 2 },
        (primary || secondary)!,
        (primary ? content.primaryCtaLink : content.secondaryCtaLink) ?? "#",
        "primary",
        "center",
      ),
    );
  }
  return blocks;
}

/** Portfolion navigaatio vanhasta osiotyypistä (vastaa aiempaa PortfolioNav-logiikkaa). */
function navFor(section: Section): Pick<FluidContent, "anchor" | "navLabel" | "navStyle"> {
  switch (section.type) {
    case "about":
      return { anchor: "tarina", navLabel: "Tarina" };
    case "techStack":
      return { anchor: "osaaminen", navLabel: (section.content as TechStackContent)?.heading || "Osaaminen" };
    case "cases":
      return { anchor: "projektit", navLabel: (section.content as CasesContent)?.heading || "Työt" };
    case "blog":
      return { anchor: "blogi", navLabel: "Blogi" };
    case "form":
      return { anchor: "yhteys", navLabel: "Ota yhteyttä", navStyle: "cta" };
    default:
      return {};
  }
}

/** Muuntaa yhden osion vapaaksi osioksi. Vapaat osiot ja alapalkki palautetaan sellaisenaan. */
export function convertSection(section: Section, makeId: MakeId, templateId?: string): Section {
  if (section.type === "fluid" || section.type === "footer") return section;

  // Portfoliopohjan osioilla on oma erikoisulkoasunsa: säilytetään kokonaisina.
  const keepWhole = templateId === "portfolio";
  let blocks: FluidBlock[];
  if (!keepWhole && section.type === "hero" && !(section.content as HeroContent).showForm) {
    blocks = convertHero(section.content as HeroContent, makeId);
  } else if (!keepWhole && section.type === "about") {
    blocks = convertAbout(section.content as AboutContent, makeId);
  } else if (!keepWhole && section.type === "cta") {
    blocks = convertCta(section.content as CtaContent, makeId);
  } else {
    blocks = [component(makeId, section.type, section.content as SectionContentMap[ComponentSectionType])];
  }

  const content: FluidContent = { blocks, ...navFor(section) };
  return {
    id: section.id,
    type: "fluid",
    content,
    isVisible: section.isVisible,
    ...(section.style && { style: section.style }),
  };
}

/** Koko sivun muunnos. Idempotentti: jo muunnettu sivu palautetaan ennallaan. */
export function convertPageToFluid(config: TemplateConfig, makeId: MakeId): TemplateConfig {
  if (config.sections.every((s) => s.type === "fluid" || s.type === "footer")) return config;
  return {
    ...config,
    sections: config.sections.map((s) => convertSection(s, makeId, config.templateId)),
  };
}
