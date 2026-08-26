import { createBrowserClient } from '@supabase/ssr';

import { createAuthFetch } from './auth-fetch';

export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // OAuth-sessio ei uusiudu legacy-endpointissa — ks. auth-fetch.ts.
      global: { fetch: createAuthFetch() },
    }
  );
}
