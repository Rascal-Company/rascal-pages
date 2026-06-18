/**
 * Shared site navigation types. Kept in a dependency-free module so both
 * server data access (`site-queries.ts`) and client components (`SiteHeader`)
 * can import it without pulling server-only code into the client bundle.
 */

export type SiteNavLink = {
  label: string;
  href: string;
};

/** Slugs that cannot be used for user-created subpages. */
export const RESERVED_PAGE_SLUGS: readonly string[] = [
  "home",
  "blog",
  "app",
  "sites",
  "api",
];
