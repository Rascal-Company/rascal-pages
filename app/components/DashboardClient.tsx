'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createClient } from '@/src/utils/supabase/client';
import LoginModal from './LoginModal';
import { useRouter } from 'next/navigation';
import { togglePagePublish } from '@/app/actions/toggle-publish';
import { useToast } from '@/app/components/ui/ToastContainer';

interface Site {
  id: string;
  user_id: string;
  subdomain: string;
  custom_domain: string | null;
  settings: Record<string, unknown>;
  published: boolean;
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
  const { showToast } = useToast();
  const [sites, setSites] = useState(initialSites);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!userId);
  const [updatingPublished, setUpdatingPublished] = useState<Record<string, boolean>>({});
  const [deletingSiteId, setDeletingSiteId] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleTogglePublish = async (siteId: string, currentPublished: boolean) => {
    setUpdatingPublished((prev) => ({ ...prev, [siteId]: true }));
    
    try {
      const result = await togglePagePublish(siteId, !currentPublished);
      if (result?.error) {
        showToast(result.error, 'error');
      } else {
        // Päivitä paikallinen tila
        setSites((prevSites) =>
          prevSites.map((site) =>
            site.id === siteId
              ? { ...site, published: !currentPublished }
              : site
          )
        );
        showToast(
          !currentPublished
            ? 'Sivu julkaistu onnistuneesti!'
            : 'Sivu piilotettu onnistuneesti!',
          'success'
        );
      }
    } catch (err) {
      showToast('Julkaisutilan päivitys epäonnistui.', 'error');
    } finally {
      setUpdatingPublished((prev) => ({ ...prev, [siteId]: false }));
    }
  };

  // Poistotoiminto
  const handleDeleteSite = async (siteId: string) => {
    setDeletingSiteId(siteId);
    setIsConfirmingDelete(true);
  };

  const confirmDeleteSite = async () => {
    if (!deletingSiteId) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/delete-site', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId: deletingSiteId }),
      });

      const result = await response.json();

      if (result.success) {
        // Päivitä sivustolista
        setSites(sites.filter(site => site.id !== deletingSiteId));
        showToast('Sivusto poistettu onnistuneesti!', 'success');
      } else {
        showToast(result.error || 'Sivuston poisto epäonnistui.', 'error');
      }
    } catch (error) {
      console.error('Virhe sivuston poistossa:', error);
      showToast('Odottamaton virhe tapahtui. Yritä uudelleen.', 'error');
    } finally {
      setDeletingSiteId(null);
      setIsConfirmingDelete(false);
      setIsDeleting(false);
    }
  };

  const cancelDeleteSite = () => {
    setDeletingSiteId(null);
    setIsConfirmingDelete(false);
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
                href="/app/dashboard/new"
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
                    href="/app/dashboard/new"
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

                    {/* Julkaisutoggle */}
                    <div className="mt-4 flex items-center justify-between rounded-lg border border-brand-dark/10 bg-white p-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-brand-dark">
                          Julkaistu
                        </p>
                        <p className="mt-0.5 text-xs text-brand-dark/60">
                          {site.published
                            ? 'Sivu on julkinen ja näkyy kävijöille'
                            : 'Sivu on piilossa'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleTogglePublish(site.id, site.published)}
                        disabled={updatingPublished[site.id]}
                        className={`
                          relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
                          transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 
                          focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed
                          ${site.published ? 'bg-blue-600' : 'bg-gray-200'}
                        `}
                        role="switch"
                        aria-checked={site.published}
                        aria-label={site.published ? 'Piilota sivu' : 'Julkaise sivu'}
                      >
                        <span
                          className={`
                            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
                            transition duration-200 ease-in-out
                            ${site.published ? 'translate-x-5' : 'translate-x-0'}
                          `}
                        />
                      </button>
                    </div>

                    {/* URL-kenttä kopiointia varten */}
                    <div className="mt-4">
                      <label className="block text-xs font-medium text-brand-dark/70 mb-1">
                        Sivuston URL
                      </label>
                      <div className="flex items-center gap-2 rounded-md border border-brand-dark/20 bg-white p-2">
                        <input
                          type="text"
                          value={`https://${site.subdomain}.rascalpages.com`}
                          readOnly
                          className="flex-1 bg-transparent text-sm text-brand-dark outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const url = `https://${site.subdomain}.rascalpages.com`;
                            navigator.clipboard.writeText(url);
                            showToast('URL kopioitu leikepöydälle!', 'success');
                          }}
                          className="flex-shrink-0 rounded p-1.5 text-brand-dark/60 transition-colors hover:bg-brand-light hover:text-brand-dark"
                          aria-label="Kopioi URL"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <Link
                        href={`/app/dashboard/${site.id}`}
                        className="flex-1 rounded-md border border-brand-dark/20 bg-white px-3 py-1.5 text-center text-sm font-medium text-brand-dark transition-colors hover:bg-brand-light"
                      >
                        Muokkaa
                      </Link>
                      <button
                        onClick={() => handleDeleteSite(site.id)}
                        className="flex-shrink-0 rounded-md border border-red-300 bg-white px-3 py-1.5 text-center text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                        disabled={updatingPublished[site.id] || isDeleting}
                      >
                        <svg
                          className="mx-auto h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Poistovahvistusdialogi */}
      {isConfirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-medium text-brand-dark">Poista sivusto</h3>
            <p className="mt-2 text-sm text-brand-dark/70">
              Oletko varma että haluat poistaa tämän sivuston? Tätä toimintoa ei voi perua.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={cancelDeleteSite}
                className="rounded-md border border-brand-dark/20 bg-white px-4 py-2 text-sm font-medium text-brand-dark transition-colors hover:bg-brand-light"
                disabled={deletingSiteId !== null}
              >
                Peruuta
              </button>
              <button
                onClick={confirmDeleteSite}
                className="rounded-md border border-red-300 bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                disabled={isDeleting}
              >
                {isDeleting ? 'Poistetaan...' : 'Poista'}
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </>
  );
}
