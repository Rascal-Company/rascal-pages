// OIDC-client Rascal ID:tä vasten (vaihe 2). Jaettu logiikka @rascal/auth-
// paketissa; tässä vain Pages-konfiguraatio. Callback on client-sivu
// (/auth/oidc-callback) → PKCE-verifier sessionStoragessa toimii, ja
// browser-clientin setSession kirjoittaa @supabase/ssr-cookiet.
// Cross-domain (rascalpages.fi ↔ id.rascalai.fi) toimii, koska OIDC käyttää
// absoluuttisia redirect-URI:eja — ei cookie-jakoa.
import { createRascalAuth } from "@rascal/auth";
import { createSupabaseBrowserClient } from "./supabase/client";

let instance: ReturnType<typeof createRascalAuth> | null = null;

function auth() {
  if (!instance) {
    instance = createRascalAuth({
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      clientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID!,
      supabase: createSupabaseBrowserClient(),
      redirectUri: () => `${window.location.origin}/auth/oidc-callback`,
    });
  }
  return instance;
}

export function startLogin(): Promise<void> {
  return auth().startLogin();
}

export function handleCallback(
  search?: string,
): Promise<{ ok: boolean; error?: string }> {
  return auth().handleCallback(search);
}

export function logout(): Promise<void> {
  return auth().logout();
}
