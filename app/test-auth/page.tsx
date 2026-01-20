'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Test page to simulate OAuth callback with tokens
 * This helps test the /auth/handoff page
 */
export default function TestAuthPage() {
  const router = useRouter();
  const [accessToken, setAccessToken] = useState('');
  const [refreshToken, setRefreshToken] = useState('');

  const handleTest = () => {
    if (!accessToken || !refreshToken) {
      alert('Please enter both access_token and refresh_token');
      return;
    }

    // Redirect to handoff page with tokens in hash
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost');
      if (isLocalhost) {
        router.push(
          `/app/auth/handoff#access_token=${encodeURIComponent(
            accessToken
          )}&refresh_token=${encodeURIComponent(refreshToken)}`
        );
      } else {
        window.location.href = `https://app.rascalpages.fi/auth/handoff#access_token=${encodeURIComponent(
          accessToken
        )}&refresh_token=${encodeURIComponent(refreshToken)}`;
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 p-8 dark:bg-black">
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="mb-4 text-2xl font-bold text-black dark:text-zinc-50">
            Test Auth Handoff
          </h1>
          <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
            Enter test tokens to simulate OAuth callback. You can get real tokens
            by logging in through Supabase Auth.
          </p>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Access Token
              </label>
              <textarea
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Paste access_token here..."
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-white dark:focus:ring-white"
                rows={3}
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Refresh Token
              </label>
              <textarea
                value={refreshToken}
                onChange={(e) => setRefreshToken(e.target.value)}
                placeholder="Paste refresh_token here..."
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:border-white dark:focus:ring-white"
                rows={3}
              />
            </div>

            <button
              onClick={handleTest}
              className="w-full rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Test Handoff
            </button>
          </div>

          <div className="mt-6 rounded-md bg-zinc-100 p-4 dark:bg-zinc-800">
            <p className="mb-2 text-sm font-medium text-zinc-900 dark:text-zinc-100">
              How to get real tokens:
            </p>
            <ol className="list-inside list-decimal space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
              <li>Use Supabase Auth to sign in (email/password or OAuth)</li>
              <li>
                Check browser console or network tab for tokens in the response
              </li>
              <li>
                Or use Supabase client: `const {'{'}{'}'} data, error {'}'} = await
                supabase.auth.getSession()`
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
