/**
 * Referenssisivun tiivistys tekoälylle (RAS-624). Raaka HTML on satoja
 * kilotavuja; tästä jää osiorakenne, otsikot, luokat ja tekstien pituudet sekä
 * CSS:stä värit, fontit ja muuttujat. Ei verkkokutsuja: haku on omassa
 * moduulissaan, joten tämä on puhdas ja testattava.
 */
import { parse, type HTMLElement, type Node } from "node-html-parser";

export type ReferenceSkeleton = {
  url: string;
  title: string;
  description: string;
  /** Sisennetty runko: tagi.luokat "teksti" (pituus). */
  outline: string;
  fonts: string[];
  /** Yleisimmät värit, yleisin ensin. */
  colors: string[];
  /** CSS-muuttujat, joiden nimi viittaa teemaan (väri, fontti, säde). */
  cssVars: Record<string, string>;
  /** Sivun kuvat absoluuttisina osoitteina (vain oman sivun tilassa käytetään). */
  images: string[];
  /** Linkitetyt tyylitiedostot, jotka kannattaa hakea. */
  stylesheets: string[];
};

const MAX_OUTLINE_CHARS = 14_000;
const MAX_DEPTH = 14;
const MAX_TEXT = 90;
const MAX_REPEATS = 2;

const DROP_TAGS = new Set([
  "script", "style", "noscript", "svg", "template", "iframe", "canvas", "video", "audio",
  "picture", "source", "link", "meta", "head", "path", "symbol", "use", "object", "embed",
]);

/** Elementit, jotka näytetään aina rungossa. Muut säiliöt tiivistetään. */
const KEEP_TAGS = new Set([
  "header", "nav", "main", "section", "article", "aside", "footer", "form",
  "h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "button", "img", "ul", "ol", "li",
  "blockquote", "figure", "figcaption", "input", "textarea", "select", "label", "table",
]);

const TEXT_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p", "a", "button", "li", "blockquote", "figcaption", "label"]);

/** Seuranta-, piilotus- ja muut kohinaluokat, joista ei ole hyötyä asettelun ymmärtämisessä. */
const NOISE_CLASS = /^(js-|w-node-|is-|has-|wf-|sr-only|hidden|visually-hidden|lazy|aos|animate)/;

function collapseWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

function shortText(text: string): string {
  const clean = collapseWhitespace(text);
  if (clean.length <= MAX_TEXT) return `"${clean}"`;
  return `"${clean.slice(0, MAX_TEXT)}…" (${clean.length} merkkiä)`;
}

function classSummary(el: HTMLElement): string {
  const raw = el.getAttribute("class") ?? "";
  const classes = raw
    .split(/\s+/)
    .filter((c) => c && !NOISE_CLASS.test(c))
    .slice(0, 8)
    .join(" ");
  return classes ? `.${classes.slice(0, 120)}` : "";
}

function absoluteUrl(value: string | undefined, base: URL): string | null {
  if (!value || value.startsWith("data:")) return null;
  try {
    const url = new URL(value.trim(), base);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function imageSrc(el: HTMLElement): string | undefined {
  return (
    el.getAttribute("src") ??
    el.getAttribute("data-src") ??
    el.getAttribute("data-lazy-src") ??
    el.getAttribute("srcset")?.split(",")[0]?.trim().split(" ")[0]
  );
}

function isElement(node: Node): node is HTMLElement {
  return node.nodeType === 1;
}

function directText(el: HTMLElement): string {
  return collapseWhitespace(
    el.childNodes
      .filter((n) => n.nodeType === 3)
      .map((n) => n.rawText)
      .join(" "),
  );
}

/** Onko tekstielementin sisällä omia rakenne-elementtejä (lista, otsikko, linkki…)? */
function hasStructure(el: HTMLElement): boolean {
  return el.querySelectorAll("*").some((child) => KEEP_TAGS.has(child.tagName.toLowerCase()));
}

/** Rakentaa sisennetyn rungon. Säiliöt, joilla on yksi lapsi, sulautetaan lapseensa. */
function outlineOf(root: HTMLElement): string {
  const lines: string[] = [];
  let size = 0;

  const visit = (el: HTMLElement, depth: number) => {
    if (size > MAX_OUTLINE_CHARS || depth > MAX_DEPTH) return;
    const tag = el.tagName?.toLowerCase();
    if (!tag || DROP_TAGS.has(tag)) return;
    if (el.getAttribute("aria-hidden") === "true" || el.getAttribute("hidden") !== undefined) return;

    const children = el.childNodes.filter(isElement).filter((c) => !DROP_TAGS.has(c.tagName.toLowerCase()));

    if (!KEEP_TAGS.has(tag)) {
      const text = directText(el);
      // Pelkkä kääre: näytetään vain, jos siinä on useampi lapsi (asettelun tieto) tai omaa tekstiä.
      if (children.length === 1 && !text) return visit(children[0], depth);
      if (children.length === 0 && !text) return;
    }

    let line = `${"  ".repeat(depth)}${tag}${classSummary(el)}`;
    if (tag === "img") {
      line += ` alt=${shortText(el.getAttribute("alt") ?? "")}`;
    } else if (tag === "input" || tag === "textarea" || tag === "select") {
      line += ` [${el.getAttribute("type") ?? tag}] ${el.getAttribute("placeholder") ?? el.getAttribute("name") ?? ""}`.trimEnd();
    } else if (TEXT_TAGS.has(tag) && !hasStructure(el)) {
      const text = collapseWhitespace(el.textContent);
      if (text) line += ` ${shortText(text)}`;
      if (tag === "a" && el.getAttribute("href")?.startsWith("#")) line += ` →${el.getAttribute("href")}`;
    } else if (children.length > 1) {
      line += ` ×${children.length}`;
    }

    lines.push(line);
    size += line.length + 1;

    // Tekstielementin sisältö on jo rivillä; rakenteellisia lapsia avataan vain, jos niitä on.
    if (TEXT_TAGS.has(tag) && !hasStructure(el)) return;

    // Toistuvat samanlaiset sisarukset (kortit, valikon kohdat): kaksi ensimmäistä riittävät.
    let previousKey = "";
    let repeats = 0;
    for (const child of children) {
      const key = `${child.tagName}${child.getAttribute("class") ?? ""}`;
      repeats = key === previousKey ? repeats + 1 : 0;
      previousKey = key;
      if (repeats === MAX_REPEATS) {
        const same = children.filter((c) => `${c.tagName}${c.getAttribute("class") ?? ""}` === key).length;
        const note = `${"  ".repeat(depth + 1)}… +${same - MAX_REPEATS} samanlaista`;
        lines.push(note);
        size += note.length + 1;
      }
      if (repeats >= MAX_REPEATS) continue;
      visit(child, depth + 1);
    }
  };

  visit(root, 0);
  if (size > MAX_OUTLINE_CHARS) lines.push("… (runko katkaistu)");
  return lines.join("\n");
}

const COLOR_RE = /#(?:[0-9a-f]{3}){1,2}\b|rgba?\([^)]+\)|hsla?\([^)]+\)/gi;
const VAR_RE = /(--[\w-]+)\s*:\s*([^;}{]+)/g;
const FONT_RE = /font-family\s*:\s*([^;}{]+)/gi;
const THEME_VAR = /(color|colour|primary|secondary|accent|brand|background|bg|foreground|text|font|radius|heading)/i;
const GENERIC_FONTS = new Set([
  "sans-serif", "serif", "monospace", "system-ui", "inherit", "initial", "-apple-system",
  "blinkmacsystemfont", "segoe ui", "helvetica", "arial", "helvetica neue", "ui-sans-serif",
  "ui-serif", "ui-monospace", "apple color emoji", "segoe ui emoji", "segoe ui symbol",
  "noto color emoji", "cursive", "fantasy", "unset", "revert", "auto",
]);
/** Ikonifontit (Font Awesome, webflow-icons, Material Icons…) eivät kerro typografiasta. */
const ICON_FONT = /icon|awesome|glyph|symbols/i;

/** Värit normalisoituna: #abc → #aabbcc, pienet kirjaimet. Läpinäkymättömät valkoinen/musta pidetään. */
function normalizeColor(value: string): string {
  const v = value.toLowerCase().replace(/\s+/g, "");
  if (/^#[0-9a-f]{3}$/.test(v)) return `#${v[1]}${v[1]}${v[2]}${v[2]}${v[3]}${v[3]}`;
  return v;
}

export function analyzeCss(css: string): Pick<ReferenceSkeleton, "fonts" | "colors" | "cssVars"> {
  const colorCounts = new Map<string, number>();
  for (const match of css.matchAll(COLOR_RE)) {
    const color = normalizeColor(match[0]);
    colorCounts.set(color, (colorCounts.get(color) ?? 0) + 1);
  }

  const cssVars: Record<string, string> = {};
  for (const match of css.matchAll(VAR_RE)) {
    const [, name, value] = match;
    if (Object.keys(cssVars).length >= 40) break;
    if (THEME_VAR.test(name) && !(name in cssVars)) cssVars[name] = value.trim().slice(0, 80);
  }

  const fontCounts = new Map<string, number>();
  for (const match of css.matchAll(FONT_RE)) {
    const first = match[1].split(",")[0].replace(/["']/g, "").replace(/!important/, "").trim();
    if (!first || first.startsWith("var(") || GENERIC_FONTS.has(first.toLowerCase()) || ICON_FONT.test(first)) continue;
    fontCounts.set(first, (fontCounts.get(first) ?? 0) + 1);
  }

  const byCount = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
  return { colors: byCount(colorCounts).slice(0, 16), fonts: byCount(fontCounts).slice(0, 6), cssVars };
}

/** Google Fonts -linkeistä fonttien nimet (css2?family=Inter:wght@…). */
function googleFonts(root: HTMLElement): string[] {
  const names: string[] = [];
  for (const link of root.querySelectorAll('link[href*="fonts.googleapis.com"]')) {
    const href = link.getAttribute("href") ?? "";
    for (const match of href.matchAll(/family=([^:&]+)/g)) {
      names.push(decodeURIComponent(match[1].replace(/\+/g, " ")));
    }
  }
  return names;
}

/**
 * Tiivistää sivun HTML:n. `extraCss` = linkitettyjen tyylitiedostojen sisältö,
 * jos ne on haettu; inline-tyylit luetaan aina.
 */
export function buildReferenceSkeleton(html: string, pageUrl: URL, extraCss = ""): ReferenceSkeleton {
  const root = parse(html, { comment: false, blockTextElements: { script: false, style: true, noscript: false, pre: true } });

  const title = collapseWhitespace(root.querySelector("title")?.textContent ?? "");
  const description =
    root.querySelector('meta[name="description"]')?.getAttribute("content") ??
    root.querySelector('meta[property="og:description"]')?.getAttribute("content") ??
    "";

  const inlineCss = root
    .querySelectorAll("style")
    .map((s) => s.textContent)
    .join("\n");
  const styleAttrs = root
    .querySelectorAll("[style]")
    .map((el) => `x{${el.getAttribute("style")}}`)
    .join("\n");
  const css = analyzeCss(`${inlineCss}\n${extraCss}\n${styleAttrs}`);

  const stylesheets = root
    .querySelectorAll('link[rel~="stylesheet"]')
    .map((l) => absoluteUrl(l.getAttribute("href"), pageUrl))
    .filter((href): href is string => Boolean(href) && !href!.includes("fonts.googleapis.com"));

  const images = [
    root.querySelector('meta[property="og:image"]')?.getAttribute("content"),
    ...root.querySelectorAll("img").map(imageSrc),
  ]
    .map((src) => absoluteUrl(src ?? undefined, pageUrl))
    .filter((src): src is string => Boolean(src) && !/\.svg(\?|$)/i.test(src!) && !/(pixel|tracking|1x1)/i.test(src!));

  const body = root.querySelector("body") ?? root;
  return {
    url: pageUrl.href,
    title,
    description: collapseWhitespace(description).slice(0, 300),
    outline: outlineOf(body),
    fonts: [...new Set([...googleFonts(root), ...css.fonts])].slice(0, 6),
    colors: css.colors,
    cssVars: css.cssVars,
    images: [...new Set(images)].slice(0, 24),
    stylesheets: [...new Set(stylesheets)].slice(0, 4),
  };
}

/**
 * Client-renderöity sivu (tyhjä juurielementti) ei kerro rakenteesta mitään.
 * Raja on tarkoituksella matala: pienikin oikea sivu ylittää sen.
 */
export function isEmptyShell(skeleton: ReferenceSkeleton): boolean {
  const textLines = skeleton.outline.split("\n").filter((line) => line.includes('"'));
  return textLines.length < 4;
}
