/**
 * Navigation utilities for multi-tenant routing
 * Single source of truth for all navigation logic
 */

/**
 * Checks if current environment is localhost
 */
export function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;

  return (
    window.location.hostname === "localhost" ||
    window.location.hostname.endsWith(".localhost")
  );
}

/**
 * Gets the root domain from env or default
 */
export function getRootDomain(): string {
  return process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi";
}

/**
 * Gets the dashboard URL for navigation after login
 * Always returns a path that works with the current domain
 */
export function getDashboardUrl(path: string = ""): string {
  // Always use relative paths - middleware handles domain routing
  return `/app/dashboard${path}`;
}

/**
 * Gets the full app URL for cross-domain redirects (e.g., after login from home page)
 * Use this only when redirecting FROM a different domain TO app subdomain
 */
export function getAppUrl(path: string = "/dashboard"): string {
  if (isLocalhost()) {
    return `/app${path}`;
  }
  return `https://app.${getRootDomain()}${path}`;
}

/**
 * Navigate to dashboard - use router.push for soft navigation
 * This should be used within the app subdomain
 */
export function getDashboardPath(subpath: string = ""): string {
  return `/app/dashboard${subpath}`;
}

/**
 * Gets the home/landing page URL for logout redirect
 * This redirects to the root domain, not app subdomain
 */
export function getHomeUrl(): string {
  if (isLocalhost()) {
    return "/";
  }
  return `https://${getRootDomain()}/`;
}
