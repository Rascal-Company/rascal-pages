'use client';

import { useEffect, useState } from 'react';
import { createSupabaseBrowserClient } from '@/src/lib/supabase/client';

export default function GetTokensPage() {
  const [tokens, setTokens] = useState<{
    accessToken: string | null;
    refreshToken: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getTokens() {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setTokens({
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
        });
      }
      setLoading(false);
    }

    getTokens();
  }, []);

  const handleLogin = async () => {
    const supabase = createSupabaseBrowserClient();
    // Test login - replace with your actual credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // Replace with test email
      password: 'testpassword', // Replace with test password
    });

    if (error) {
      alert(`Login error: ${error.message}`);
      return;
    }

    if (data.session) {
      setTokens({
        accessToken: data.session.access_token,
        refreshToken: data.session.refresh_token,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-black"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="mb-4 text-2xl font-bold text-black dark:text-zinc-50">
            Get Auth Tokens
          </h1>

          {!tokens ? (
            <div>
              <p className="mb-4 text-zinc-600 dark:text-zinc-400">
                No active session. Sign in to get tokens.
              </p>
              <button
                onClick={handleLogin}
                className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
              >
                Sign In (Test)
              </button>
              <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
                Note: Update email/password in the code or use Supabase Auth UI
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Access Token
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={tokens.accessToken || ''}
                    readOnly
                    className="flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    rows={3}
                  />
                  <button
                    onClick={() => copyToClipboard(tokens.accessToken || '')}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Refresh Token
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={tokens.refreshToken || ''}
                    readOnly
                    className="flex-1 rounded-md border border-zinc-300 bg-zinc-50 px-3 py-2 text-xs focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    rows={3}
                  />
                  <button
                    onClick={() => copyToClipboard(tokens.refreshToken || '')}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="mt-6">
                <a
                  href={`/auth/handoff#access_token=${encodeURIComponent(
                    tokens.accessToken || ''
                  )}&refresh_token=${encodeURIComponent(
                    tokens.refreshToken || ''
                  )}`}
                  className="block rounded-md bg-black px-4 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  Test Handoff Page
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
