/**
 * Branded types for improved type safety (CLAUDE.md C-5).
 * Ported from the Rascal Pages app; trimmed to what the standalone site needs.
 */

export type Brand<T, TBrand> = T & { readonly __brand: TBrand };

export type SectionId = Brand<string, "SectionId">;

export function createSectionId(id: string): SectionId {
  return id as SectionId;
}
