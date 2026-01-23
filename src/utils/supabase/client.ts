import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "rascalpages.fi";
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname.endsWith(".localhost"));

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Aseta evästeet juuritason domainiin, jotta ne toimivat kaikkien subdomainien välillä
        // Localhost: ei aseteta domainia
        // Tuotanto: .rascalpages.fi (huomaa piste alussa)
        domain: isLocalhost ? undefined : `.${rootDomain}`,
      },
    },
  );
}
