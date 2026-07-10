"use client";

import { useEffect, useRef, useState } from "react";
import { handleCallback } from "@/src/lib/oidc";

// OIDC-callback (client): vaihtaa Rascal ID:ltä saadun koodin sessioksi
// (code + PKCE). Full-page-navigointi /app/dashboardiin, jotta server-
// komponentit näkevät uuden sessio-cookien.
export default function OidcCallbackPage() {
  const [errored, setErrored] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    void (async () => {
      const result = await handleCallback(window.location.search);
      if (!result.ok) {
        setErrored(true);
        return;
      }
      window.location.assign("/app/dashboard");
    })();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-brand-beige p-6 text-center shadow-xl">
        {errored ? (
          <>
            <p className="mb-4 text-sm text-red-800">
              Kirjautuminen epäonnistui. Yritä uudelleen.
            </p>
            <a href="/home" className="text-brand-dark underline">
              Takaisin etusivulle
            </a>
          </>
        ) : (
          <p className="text-brand-dark">Kirjaudutaan…</p>
        )}
      </div>
    </div>
  );
}
