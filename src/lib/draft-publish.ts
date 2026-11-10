/**
 * Luonnos ja julkaisu erikseen (pages.draft_content, overlay_variants.draft_changes).
 * Live-versio on aina vanha sarake; luonnos kirjoitetaan tallennuksessa ja
 * kopioidaan liveksi vasta Julkaise-toiminnolla.
 */

/** jsonb palautuu normalisoituna, joten JSON-merkkijonovertailu riittää. */
function sameJson(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

/** Onko julkaistulla sivulla luonnos, joka poikkeaa live-sisällöstä. */
export function pageHasUnpublishedChanges(page: {
  published: boolean | null;
  content: unknown;
  draft_content: unknown;
}): boolean {
  if (!page.published || page.draft_content == null) return false;
  return !sameJson(page.draft_content, page.content);
}

/** Sisältö, jota editori muokkaa: luonnos, jos sellainen on, muuten live. */
export function editableContent<T>(page: { content: T; draft_content: T | null }): T {
  return page.draft_content ?? page.content;
}

/** Onko julkaistulla variaatiolla luonnos, joka poikkeaa live-muutoksista. */
export function variantHasUnpublishedChanges(variant: {
  active: boolean;
  changes: unknown;
  draft_changes: unknown;
}): boolean {
  if (!variant.active) return false;
  return !sameJson(variant.draft_changes ?? [], variant.changes ?? []);
}
