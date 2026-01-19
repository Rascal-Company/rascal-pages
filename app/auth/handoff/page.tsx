'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/src/utils/supabase/client';

export default function AuthHandoff() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState('Autentikoidaan...');

  useEffect(() => {
    const handleSession = async () => {
      // 1. Lue tokenit URL:n hashista (#access_token=...&refresh_token=...)
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);

      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      if (!accessToken || !refreshToken) {
        // Jos tokeneita ei ole hashissa, tarkistetaan onko käyttäjä jo kirjautunut
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          router.replace('/dashboard');
          return;
        }
        setStatus('Virhe: Ei kirjautumistietoja.');
        return;
      }

      // 2. Aseta istunto (Tämä asettaa evästeet automaattisesti @supabase/ssr avulla)
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        console.error('Handoff error:', error);
        setStatus('Kirjautuminen epäonnistui.');
      } else {
        // 3. Päivitä router ja ohjaa dashboardiin
        router.refresh(); // Varmistaa että server componentit tajuavat uuden keksin
        router.replace('/dashboard');
      }
    };

    handleSession();
  }, [router, supabase.auth]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50 font-sans">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  );
}
