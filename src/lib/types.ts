/**
 * Branded types for improved type safety
 * Following CLAUDE.md best practice C-5
 */

// Brand utility type
type Brand<T, TBrand> = T & { readonly __brand: TBrand };

/**
 * Branded type for Site ID to prevent mixing with other string IDs
 */
export type SiteId = Brand<string, "SiteId">;

/**
 * Create a branded SiteId from a string
 * Use this when receiving IDs from external sources (DB, URL params, etc.)
 */
export function createSiteId(id: string): SiteId {
  return id as SiteId;
}

/**
 * Type guard to check if a string is a valid UUID format
 * Useful for validating SiteIds before creating them
 */
export function isValidUuid(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Extract the raw string value from a branded type
 * Use sparingly - only when interfacing with external libraries
 */
export function unwrapSiteId(id: SiteId): string {
  return id;
}
