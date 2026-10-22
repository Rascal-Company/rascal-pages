/**
 * Overlay Pages-sivulla: kampanjan kohteena on oma Pages-sivusto, joten
 * muutokset sovelletaan palvelimella sisältömalliin ennen renderöintiä
 * (ei snippettiä, ei välähdystä). Elementit tunnistetaan lohkon pysyvästä
 * tunnisteesta (data-rp-block), jonka julkinen renderöinti lisää.
 */
import type { FluidBlock, FluidContent } from "./fluid";
import type { OverlayChange } from "./overlay";
import { BLOCK_ATTR } from "./overlay-selector";
import type { Section, TemplateConfig } from "./templates";

type SiteHosts = { subdomain: string | null; custom_domain: string | null };

/**
 * Kaikki originit, joista sivusto vastaa: custom domain ensin (ensisijainen,
 * jolla kampanja luodaan), sitten subdomain.
 */
export function pagesSiteOrigins(
  site: SiteHosts,
  rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi",
): string[] {
  return [
    site.custom_domain ? `https://${site.custom_domain}` : null,
    site.subdomain ? `https://${site.subdomain}.${rootDomain}` : null,
  ].filter((origin): origin is string => origin !== null);
}

const BLOCK_SELECTOR = new RegExp(`^\\[${BLOCK_ATTR}="([\\w-]{1,64})"\\]`);

/** Lohkon tunniste muutoksen selektorista, jos muutos kohdistuu Pages-lohkoon. */
export function blockIdFromSelector(selector: string): string | null {
  return selector.trim().match(BLOCK_SELECTOR)?.[1] ?? null;
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

type BlockResult = { block: FluidBlock | null } | "skip";

/**
 * Soveltaa yhden muutoksen lohkoon. block: null = lohko piilotetaan.
 * "skip" = palvelin ei osaa kohdistaa muutosta (esim. elementti lohkon
 * sisällä tai sormenjälki ei täsmää) — samat säännöt kuin o.js:ssä.
 */
function applyToBlock(block: FluidBlock, change: OverlayChange, exact: boolean): BlockResult {
  if (change.type === "hide") return exact ? { block: null } : "skip";

  if (block.type === "text" && change.type === "text") {
    if (normalize(block.content.text) !== change.original) return "skip";
    return { block: { ...block, content: { ...block.content, text: change.value } } };
  }
  if (block.type === "image" && change.type === "image") {
    if (block.content.src !== change.original) return "skip";
    return { block: { ...block, content: { ...block.content, src: change.value } } };
  }
  if (block.type === "button" && change.type === "text") {
    if (normalize(block.content.label) !== change.original) return "skip";
    return { block: { ...block, content: { ...block.content, label: change.value } } };
  }
  if (block.type === "button" && change.type === "link") {
    if ((block.content.href || "#") !== change.original) return "skip";
    return { block: { ...block, content: { ...block.content, href: change.value } } };
  }
  return "skip";
}

/**
 * Soveltaa variaation muutokset sivun vapaiden osioiden lohkoihin.
 * Palauttaa myös muutokset, joita ei voitu kohdistaa: ne sovelletaan
 * selaimessa (o.js applied-tila).
 */
export function applyOverlayChanges(
  content: TemplateConfig,
  changes: OverlayChange[],
): { content: TemplateConfig; unapplied: OverlayChange[] } {
  const byBlock = new Map<string, OverlayChange[]>();
  const unapplied: OverlayChange[] = [];
  for (const change of changes) {
    const id = blockIdFromSelector(change.selector);
    if (id) byBlock.set(id, [...(byBlock.get(id) ?? []), change]);
    else unapplied.push(change);
  }
  if (byBlock.size === 0) return { content, unapplied };

  const seen = new Set<string>();
  const sections = content.sections.map((section) => {
    if (section.type !== "fluid") return section;
    const fluid = section.content as FluidContent;
    const blocks = fluid.blocks.flatMap((block) => {
      seen.add(block.id);
      let current: FluidBlock | null = block;
      for (const change of byBlock.get(block.id) ?? []) {
        if (!current) break;
        // Piilotus poistaa lohkon vain, kun valittu elementti on lohko itse.
        const exact = change.selector.trim() === `[${BLOCK_ATTR}="${block.id}"]`;
        const result = applyToBlock(current, change, exact);
        if (result === "skip") unapplied.push(change);
        else current = result.block;
      }
      return current ? [current] : [];
    });
    return { ...section, content: { ...fluid, blocks } } as Section;
  });
  for (const [id, list] of byBlock) if (!seen.has(id)) unapplied.push(...list);
  return { content: { ...content, sections }, unapplied };
}
