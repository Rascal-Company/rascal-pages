import { createRascalFetch } from '@rascal/auth';

// Kirjautuminen kulkee Rascal ID:n OAuth-kulussa, jolloin sessio kantaa
// GoTruessa OAuthClientID:tä ja jokaisen uusimisen on tuotava täsmäävä
// client_id (supabase/auth internal/tokens/service.go). supabase-js uusii
// legacy-endpointissa joka ei liitä clientiä lainkaan:
//
//   POST /auth/v1/token?grant_type=refresh_token
//   → 400 invalid_client: Client authentication required for OAuth session
//
// Ja koska supabase-js poistaa session mistä tahansa 4xx:stä ilman
// uudelleenyritystä, yksi hylkäys heittää käyttäjän ulos kesken työn (RAS-526).
//
// Pagesissa uusiminen voi lähteä VIIDESTÄ paikasta, jotka kaikki osoittavat
// samaan projektiin:
//   lib/supabase/client.ts     selain (pitää OAuth-session, ks. lib/oidc.ts)
//   lib/supabase/server.ts     server components
//   utils/supabase/client.ts   selain-singleton (oma storageKey)
//   utils/supabase/server.ts   server
//   proxy.ts                   getSession() uusii vanhentuneen tokenin
//
// Yksikin väliin jäänyt tappaisi session yhtä varmasti kuin ei korjausta
// lainkaan, joten kääre rakennetaan tässä ja kytketään kaikkiin.
//
// Ympäristö luetaan kutsuttaessa eikä module-scopessa, koska nämä ajetaan eri
// runtimeissa (selain, edge, node).
export function createAuthFetch() {
  return createRascalFetch({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    // Tyhjä id = @rascal/auth ei ohjaa uusimista mihinkään. Ympäristö joka ei
    // käytä OAuth-kirjautumista säilyy koskemattomana.
    clientId: process.env.NEXT_PUBLIC_OAUTH_CLIENT_ID ?? '',
  });
}
