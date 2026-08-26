import { createRascalFetch } from '@rascal/auth';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { createAuthFetch } from './auth-fetch';

// Pages kirjautuu Rascal ID:n OAuth-kulussa, jolloin sessio kantaa GoTruessa
// OAuthClientID:tä. supabase-js uusii tokenin legacy-endpointissa joka ei
// liitä client_id:tä → 400 invalid_client → yksi hylkäys tappaa session
// (RAS-526).
//
// Uusiminen voi lähteä viidestä paikasta (kaksi selain-clientiä, kaksi
// server-clientiä ja proxy), joten kääre rakennetaan yhdessä paikassa.

vi.mock('@rascal/auth', () => ({
  createRascalFetch: vi.fn(() => 'rascal-fetch'),
}));

const ENV = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://proj.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  NEXT_PUBLIC_OAUTH_CLIENT_ID: 'pages-client-id',
};

beforeEach(() => {
  vi.mocked(createRascalFetch).mockClear();
  for (const [key, value] of Object.entries(ENV)) vi.stubEnv(key, value);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('createAuthFetch', () => {
  test('rakentaa kääreen projektin arvoilla', () => {
    createAuthFetch();

    const config = vi.mocked(createRascalFetch).mock.calls[0][0];
    expect(config.supabaseUrl).toBe(ENV.NEXT_PUBLIC_SUPABASE_URL);
    expect(config.anonKey).toBe(ENV.NEXT_PUBLIC_SUPABASE_ANON_KEY);
    expect(config.clientId).toBe(ENV.NEXT_PUBLIC_OAUTH_CLIENT_ID);
  });

  test('lukee ympäristön kutsuttaessa, ei importissa', () => {
    // Selain, edge ja node ajavat nämä eri runtimeissa; module-scope -luku
    // sitoisi arvot importtihetkeen.
    createAuthFetch();
    vi.stubEnv('NEXT_PUBLIC_OAUTH_CLIENT_ID', 'toinen-id');
    createAuthFetch();

    const calls = vi.mocked(createRascalFetch).mock.calls;
    expect(calls[0][0].clientId).toBe('pages-client-id');
    expect(calls[1][0].clientId).toBe('toinen-id');
  });

  test('puuttuva client_id ei kaada vaan jättää uusimisen koskematta', () => {
    // Tyhjä id on @rascal/auth:n sopimus "älä ohjaa mitään". Ilman tätä
    // undefined päätyisi client_id-kenttään ja rikkoisi uusimisen.
    vi.stubEnv('NEXT_PUBLIC_OAUTH_CLIENT_ID', '');

    createAuthFetch();

    expect(vi.mocked(createRascalFetch).mock.calls[0][0].clientId).toBe('');
  });

  test('palauttaa @rascal/auth:n käärön sellaisenaan', () => {
    expect(createAuthFetch()).toBe('rascal-fetch');
  });
});
