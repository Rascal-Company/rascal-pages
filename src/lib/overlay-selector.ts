/**
 * Yksilöivän CSS-selektorin muodostus klikatulle elementille overlay-editorissa.
 * Suosii pysyviä id:itä; muuten nth-of-type-polku lähimmästä id:llisestä
 * esivanhemmasta. Selektorin hauraus kompensoidaan sormenjäljellä (original).
 */

/** Generoidun näköiset id:t (esim. "w-node-1a2b3c", "react-12") eivät ole pysyviä. */
function isStableId(id: string): boolean {
  return /^[A-Za-z][\w-]{0,63}$/.test(id) && !/\d{3,}|[a-f0-9]{6,}/i.test(id);
}

function escapeIdent(value: string): string {
  return value.replace(/([^\w-])/g, "\\$1");
}

function isUnique(doc: Document, selector: string, el: Element): boolean {
  try {
    const found = doc.querySelectorAll(selector);
    return found.length === 1 && found[0] === el;
  } catch {
    return false;
  }
}

function step(el: Element): string {
  const tag = el.tagName.toLowerCase();
  let index = 1;
  let sibling = el.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === el.tagName) index++;
    sibling = sibling.previousElementSibling;
  }
  return `${tag}:nth-of-type(${index})`;
}

export function buildSelector(el: Element): string {
  const doc = el.ownerDocument;

  if (el.id && isStableId(el.id)) {
    const byId = `#${escapeIdent(el.id)}`;
    if (isUnique(doc, byId, el)) return byId;
  }

  const parts: string[] = [];
  let current: Element | null = el;
  while (current && current !== doc.documentElement) {
    if (current !== el && current.id && isStableId(current.id)) {
      const anchor = `#${escapeIdent(current.id)}`;
      if (isUnique(doc, anchor, current)) {
        parts.unshift(anchor);
        break;
      }
    }
    if (current === doc.body) {
      parts.unshift("body");
      break;
    }
    parts.unshift(step(current));
    current = current.parentElement;
  }

  return parts.join(" > ");
}

/** Sama normalisointi kuin snippetissä (public/overlay/o.js). */
export function normalizeText(value: string | null | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

/** Sormenjälki muutostyypin mukaan — pidettävä samana kuin o.js:n fingerprint(). */
export function fingerprintOf(
  el: Element,
  type: "text" | "image" | "link" | "hide",
): string {
  if (type === "image") return el.getAttribute("src") ?? "";
  if (type === "link") return el.getAttribute("href") ?? "";
  if (type === "hide") return el.tagName.toLowerCase();
  return normalizeText(el.textContent);
}

/** Tekstimuokkaus sallitaan vain elementeille, joissa ei ole lapsielementtejä. */
export function canEditText(el: Element): boolean {
  return el.children.length === 0 && normalizeText(el.textContent).length > 0;
}
