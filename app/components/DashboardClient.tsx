'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/src/utils/supabase/client';
import LoginModal from './LoginModal';
import { useRouter } from 'next/navigation';

interface Site {
  id: string;
  user_id: string;
  subdomain: string;
  custom_domain: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface DashboardClientProps {
  initialSites: Site[];
  userId: string | null;
}

export default function DashboardClient({
  initialSites,
  userId,
}: DashboardClientProps) {
  const [sites, setSites] = useState(initialSites);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!userId);
  const router = useRouter();

  useEffect(() => {
    // Check auth status on mount
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      if (!session) {
        setIsLoginModalOpen(true);
      }
    }
    checkAuth();

    // Listen for auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
      if (session) {
        setIsLoginModalOpen(false);
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  };

  if (!isAuthenticated) {
    return (
      <>
        <div className="flex min-h-screen items-center justify-center bg-brand-light">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-brand-dark">
              Kirjaudu sisään
            </h1>
            <button
              onClick={() => setIsLoginModalOpen(true)}
              className="mt-4 rounded-lg bg-brand-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-accent/90"
            >
              Kirjaudu sisään
            </button>
          </div>
        </div>
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-brand-light">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Otsikko */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-dark">
                Omat sivustot
              </h1>
            </div>
            <div className="flex gap-3">
              <Link
                href="/dashboard/new"
                className="rounded-lg bg-brand-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-accent/90"
              >
                + Uusi sivusto
              </Link>
              <button
                onClick={handleLogout}
                type="button"
                className="rounded-lg border border-brand-dark/20 bg-brand-beige px-6 py-3 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-beige/80"
              >
                Kirjaudu ulos
              </button>
            </div>
          </div>

          {/* Sivustojen ruudukko */}
          {sites.length === 0 ? (
            <div className="rounded-lg border border-dashed border-brand-dark/20 bg-brand-beige p-12 text-center">
              <div className="mx-auto max-w-md">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <h3 className="mt-4 text-lg font-semibold text-brand-dark">
                  Ei vielä sivustoja
                </h3>
                <p className="mt-2 text-sm text-brand-dark/70">
                  Aloita luomalla ensimmäinen sivustosi
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/new"
                    className="inline-flex items-center rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-accent/90"
                  >
                    + Uusi sivusto
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site) => (
                <div
                  key={site.id}
                  className="group relative overflow-hidden rounded-lg border border-brand-dark/10 bg-brand-beige shadow-sm transition-shadow hover:shadow-md"
                >
                  {/* Placeholder-kuvake */}
                  <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <svg
                      className="h-16 w-16 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-brand-dark">
                          {site.subdomain}.rascalpages.com
                        </h3>
                        {site.custom_domain && (
                          <p className="mt-1 text-sm text-brand-dark/70">
                            {site.custom_domain}
                          </p>
                        )}
                      </div>
                    </div>


                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/dashboard/${site.id}`}
                        className="flex-1 rounded-md border border-brand-dark/20 bg-white px-3 py-1.5 text-center text-sm font-medium text-brand-dark transition-colors hover:bg-brand-light"
                      >
                        Muokkaa
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
