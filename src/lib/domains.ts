/**
 * Pure host → site-domain resolution, mirroring the rewrite logic in proxy.ts.
 * Used by host-aware routes (sitemap, robots) that do not pass through the
 * tenant rewrite and therefore receive the raw host header.
 */

/**
 * Resolve the value used to look up a site (its subdomain or custom domain)
 * from an incoming host header.
 *
 * - `sami.rascalpages.fi`        -> `sami`        (subdomain)
 * - `sami.localhost:3000`        -> `sami`        (local subdomain)
 * - `samikiias.fi`               -> `samikiias.fi` (custom domain)
 */
export function hostToSiteDomain(host: string, rootDomain: string): string {
  const withoutPort = host.replace(/:\d+$/, "");

  if (withoutPort.endsWith(`.${rootDomain}`)) {
    return withoutPort.slice(0, -`.${rootDomain}`.length);
  }

  if (withoutPort.endsWith(".localhost")) {
    return withoutPort.slice(0, -".localhost".length);
  }

  return withoutPort;
}
