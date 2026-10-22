import { cookies } from "next/headers";
import { migrateToSections } from "@/app/components/editor/utils/contentUtils";
import { applyOverlayChanges } from "@/src/lib/overlay-pages";
import {
  OVERLAY_PARAMS_COOKIE,
  OVERLAY_VISITOR_COOKIE,
  resolvePagesOverlay,
  type PagesOverlaySite,
} from "@/src/lib/overlay-pages-server";
import type { TemplateConfig } from "@/src/lib/templates";

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Pages-sivun overlay: valitsee kävijän variaation ja soveltaa sen sisältöön
 * ennen renderöintiä. Palauttaa myös o.js-skriptin (tilastot, evästeet ja
 * muutokset, joita palvelin ei osannut kohdistaa). Ilman osumaa sisältö
 * palautetaan sellaisenaan eikä skriptiä ladata.
 */
export async function withPagesOverlay(
  site: PagesOverlaySite,
  content: TemplateConfig,
  pathname: string,
  searchParams: SearchParams,
): Promise<{ content: TemplateConfig; script: React.ReactNode }> {
  const store = await cookies();
  const overlay = await resolvePagesOverlay(site, {
    pathname,
    query: searchParams,
    cookies: {
      params: store.get(OVERLAY_PARAMS_COOKIE)?.value,
      visitorId: store.get(OVERLAY_VISITOR_COOKIE)?.value,
    },
  });
  if (!overlay) return { content, script: null };

  const applied = applyOverlayChanges(migrateToSections(content), overlay.changes);
  const script = (
    <script
      defer
      src="/overlay/o.js"
      data-site={overlay.overlaySiteId}
      data-rp-applied={overlay.variantId}
      data-rp-vid={overlay.visitorId || undefined}
      data-rp-params={JSON.stringify(overlay.params)}
      data-rp-changes={applied.unapplied.length ? JSON.stringify(applied.unapplied) : undefined}
      data-rp-notrack={overlay.preview ? "" : undefined}
    />
  );
  return { content: applied.content, script };
}
