/**
 * Referenssisivun haku (RAS-624): HTML ja linkitetyt tyylitiedostot
 * SSRF-suojatulla GET-kutsulla, sitten tiivistys. Ei kuvakaappausta.
 */
import { fetchPublicHtml, fetchPublicText } from "./overlay-proxy";
import { buildReferenceSkeleton, isEmptyShell, type ReferenceSkeleton } from "./reference-skeleton";

const MAX_STYLESHEETS = 3;
const MAX_CSS_BYTES = 1.5 * 1024 * 1024;

export type ReferenceFetchResult =
  | { ok: true; skeleton: ReferenceSkeleton }
  | { ok: false; url: string; error: string };

/** Hyväksyy myös osoitteen ilman protokollaa (example.com). */
export function normalizeReferenceUrl(raw: string): URL | null {
  const value = raw.trim();
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url;
  } catch {
    return null;
  }
}

async function fetchCss(href: string): Promise<string> {
  try {
    const { text } = await fetchPublicText(new URL(href), {
      accept: "text/css,*/*;q=0.1",
      contentTypes: ["text/css", "text/plain"],
      maxBytes: MAX_CSS_BYTES,
    });
    return text;
  } catch {
    // Tyylitiedosto on lisätieto: sivu analysoidaan ilman sitä.
    return "";
  }
}

export async function fetchReferenceSkeleton(raw: string): Promise<ReferenceFetchResult> {
  const start = normalizeReferenceUrl(raw);
  if (!start) return { ok: false, url: raw, error: "Osoite ei kelpaa." };

  let html: string;
  let finalUrl: URL;
  try {
    ({ html, finalUrl } = await fetchPublicHtml(start));
  } catch (error) {
    const message = error instanceof Error && error.name !== "TimeoutError" ? error.message : "Sivu ei vastannut ajoissa.";
    return { ok: false, url: start.href, error: message };
  }

  const first = buildReferenceSkeleton(html, finalUrl);
  const css = await Promise.all(first.stylesheets.slice(0, MAX_STYLESHEETS).map(fetchCss));
  const skeleton = buildReferenceSkeleton(html, finalUrl, css.join("\n"));

  if (isEmptyShell(skeleton)) {
    return {
      ok: false,
      url: finalUrl.href,
      error: "Sivu rakentuu vasta selaimessa, joten sen rakennetta ei voi lukea. Kokeile toista sivua.",
    };
  }
  return { ok: true, skeleton };
}
