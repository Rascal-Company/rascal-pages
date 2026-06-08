/**
 * Pure naming/validation helpers for provisioning. No I/O — unit tested.
 */

export const DEFAULT_ROOT_DOMAIN = "rascalpages.fi";

/** GitHub repo name for a customer site, e.g. "rascal-site-samikiias". */
export function buildRepoName(subdomain: string): string {
  return `rascal-site-${subdomain}`;
}

/** Public subdomain host, e.g. "samikiias.rascalpages.fi". */
export function buildSubdomainHost(
  subdomain: string,
  rootDomain: string = DEFAULT_ROOT_DOMAIN,
): string {
  return `${subdomain}.${rootDomain}`;
}

/**
 * Validate a subdomain label: lowercase alphanumeric and hyphens, not starting
 * or ending with a hyphen, max 63 chars (DNS label rules).
 */
export function isValidSubdomain(subdomain: string): boolean {
  return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(subdomain);
}
