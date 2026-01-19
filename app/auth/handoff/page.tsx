'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/src/lib/supabase/client';

export default function AuthHandoffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function handleAuthHandoff() {
      try {
        // Read tokens from URL hash
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          setError('Missing access_token or refresh_token in URL');
          setLoading(false);
          return;
        }

        // Create Supabase client
        const supabase = createSupabaseBrowserClient();

        // Set the session using the tokens
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (sessionError) {
          setError(`Failed to set session: ${sessionError.message}`);
          setLoading(false);
          return;
        }

        // Clear the hash from URL
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );

        // Redirect to dashboard
        router.push('/dashboard');
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
        setLoading(false);
      }
    }

    handleAuthHandoff();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="text-center">
        {loading && (
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-black dark:border-zinc-700 dark:border-t-white"></div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Setting up your session...
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">
              Error
            </p>
            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Go Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
