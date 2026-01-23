/**
 * Navigation utilities for multi-tenant routing
 */

/**
 * Gets the appropriate dashboard URL based on environment
 */
export function getDashboardUrl(path: string = ""): string {
  if (typeof window !== "undefined") {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname.endsWith(".localhost");

    if (isLocalhost) {
      return `/app/dashboard${path}`;
    }
  }

  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi";
  return `https://app.${rootDomain}/dashboard${path}`;
}

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
