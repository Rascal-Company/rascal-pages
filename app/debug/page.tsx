'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/src/utils/supabase/client';

interface UserInfo {
  authUserId: string | null;
  usersTableId: string | null;
  orgId: string | null;
  orgRole: string | null;
  email: string | null;
  sessionExists: boolean;
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
  error: string | null;
}

export default function DebugPage() {
  const [userInfo, setUserInfo] = useState<UserInfo>({
    authUserId: null,
    usersTableId: null,
    orgId: null,
    orgRole: null,
    email: null,
    sessionExists: false,
    hasAccessToken: false,
    hasRefreshToken: false,
    error: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const supabase = createClient();

        // 1. Tarkista session ensin
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        const sessionExists = !!session;
        const hasAccessToken = !!session?.access_token;
        const hasRefreshToken = !!session?.refresh_token;

        // 2. Hae käyttäjä Supabase Auth:sta
        const {
          data: { user: authUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          setUserInfo({
            authUserId: null,
            usersTableId: null,
            orgId: null,
            orgRole: null,
            email: null,
            sessionExists,
            hasAccessToken,
            hasRefreshToken,
            error: `Auth error: ${authError.message}`,
          });
          setLoading(false);
          return;
        }

        if (!authUser) {
          setUserInfo({
            authUserId: null,
            usersTableId: null,
            orgId: null,
            orgRole: null,
            email: null,
            sessionExists,
            hasAccessToken,
            hasRefreshToken,
            error: sessionExists
              ? 'Session on olemassa, mutta käyttäjää ei löydy'
              : 'Ei kirjautunut sisään - session puuttuu',
          });
          setLoading(false);
          return;
        }

        // 3. Hae käyttäjän organisaatio org_members taulusta
        const { data: orgMember, error: orgMemberError } = await supabase
          .from('org_members')
          .select('org_id, role, email')
          .eq('auth_user_id', authUser.id)
          .maybeSingle();

        if (orgMemberError) {
          setUserInfo({
            authUserId: authUser.id,
            usersTableId: null,
            orgId: null,
            orgRole: null,
            email: authUser.email || null,
            sessionExists,
            hasAccessToken,
            hasRefreshToken,
            error: `Org members error: ${orgMemberError.message}`,
          });
          setLoading(false);
          return;
        }

        // 4. Jos org_members löytyi, hae organisaation tiedot users-taulusta
        let usersTableId = null;
        if (orgMember) {
          const { data: orgData, error: orgError } = await supabase
            .from('users')
            .select('id')
            .eq('id', orgMember.org_id)
            .maybeSingle();

          if (!orgError && orgData) {
            usersTableId = orgData.id;
          }
        }

        setUserInfo({
          authUserId: authUser.id,
          usersTableId: usersTableId,
          orgId: orgMember?.org_id || null,
          orgRole: orgMember?.role || null,
          email: orgMember?.email || authUser.email || null,
          sessionExists,
          hasAccessToken,
          hasRefreshToken,
          error: orgMember ? null : 'Käyttäjää ei löydy org_members-taulusta',
        });
      } catch (err) {
        setUserInfo({
          authUserId: null,
          usersTableId: null,
          orgId: null,
          orgRole: null,
          email: null,
          sessionExists: false,
          hasAccessToken: false,
          hasRefreshToken: false,
          error: err instanceof Error ? err.message : 'Odottamaton virhe',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchUserInfo();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Debug: Käyttäjätiedot
        </h1>

        {loading ? (
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-gray-600">Ladataan...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Session Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Session-tiedot
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-40">
                    Session olemassa:
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      userInfo.sessionExists ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {userInfo.sessionExists ? '✓ Kyllä' : '✗ Ei'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-40">
                    Access Token:
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      userInfo.hasAccessToken ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {userInfo.hasAccessToken ? '✓ Kyllä' : '✗ Ei'}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-40">
                    Refresh Token:
                  </span>
                  <span
                    className={`text-sm font-semibold ${
                      userInfo.hasRefreshToken ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {userInfo.hasRefreshToken ? '✓ Kyllä' : '✗ Ei'}
                  </span>
                </div>
              </div>
            </div>

            {/* Auth User Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Supabase Auth (auth.users)
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-32">
                    User ID:
                  </span>
                  <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm text-gray-900 font-mono">
                    {userInfo.authUserId || 'Ei saatavilla'}
                  </code>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-32">
                    Email:
                  </span>
                  <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm text-gray-900 font-mono">
                    {userInfo.email || 'Ei saatavilla'}
                  </code>
                </div>
              </div>
            </div>

            {/* Org Members Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Org Members (public.org_members)
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-32">
                    Org ID:
                  </span>
                  <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm text-gray-900 font-mono">
                    {userInfo.orgId || 'Ei löydy'}
                  </code>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-32">
                    Rooli:
                  </span>
                  <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm text-gray-900 font-mono">
                    {userInfo.orgRole || 'Ei löydy'}
                  </code>
                </div>
                {userInfo.orgId && (
                  <div className="mt-4 rounded-md bg-green-50 p-4">
                    <p className="text-sm text-green-800">
                      ✓ Käyttäjä löytyy org_members-taulusta
                    </p>
                  </div>
                )}
                {!userInfo.orgId && userInfo.authUserId && (
                  <div className="mt-4 rounded-md bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠ Käyttäjä on Auth:ssa, mutta ei org_members-taulussa
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Users Table Info */}
            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Public Users Table (public.users)
              </h2>
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 w-32">
                    User ID (org_id):
                  </span>
                  <code className="flex-1 rounded bg-gray-100 px-3 py-2 text-sm text-gray-900 font-mono">
                    {userInfo.usersTableId || 'Ei löydy'}
                  </code>
                </div>
                {userInfo.usersTableId && (
                  <div className="mt-4 rounded-md bg-green-50 p-4">
                    <p className="text-sm text-green-800">
                      ✓ Organisaatio löytyy users-taulusta
                    </p>
                  </div>
                )}
                {!userInfo.usersTableId && userInfo.orgId && (
                  <div className="mt-4 rounded-md bg-yellow-50 p-4">
                    <p className="text-sm text-yellow-800">
                      ⚠ Org ID löytyy, mutta organisaatiota ei löydy users-taulusta
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Error Display */}
            {userInfo.error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-2">
                  Virhe
                </h3>
                <p className="text-sm text-red-800">{userInfo.error}</p>
              </div>
            )}

            {/* Comparison */}
            {userInfo.authUserId && userInfo.usersTableId && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Vertailu
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-blue-700 w-32">
                      ID:t täsmäävät:
                    </span>
                    <span
                      className={`text-sm font-semibold ${
                        userInfo.authUserId === userInfo.usersTableId
                          ? 'text-green-700'
                          : 'text-red-700'
                      }`}
                    >
                      {userInfo.authUserId === userInfo.usersTableId
                        ? '✓ Kyllä'
                        : '✗ Ei'}
                    </span>
                  </div>
                  {userInfo.authUserId !== userInfo.usersTableId && (
                    <div className="mt-2 text-sm text-red-800">
                      <p>Auth ID: {userInfo.authUserId}</p>
                      <p>Users ID: {userInfo.usersTableId}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => window.location.reload()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Päivitä
              </button>
              <a
                href="/app/dashboard"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Takaisin Dashboardiin
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
