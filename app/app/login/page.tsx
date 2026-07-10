"use client";

import { useEffect, useRef } from "react";
import { startLogin } from "@/src/lib/oidc";

// Login-käynnistys app-hostilla (app.rascalpages.fi). www:n LoginModal ohjaa
// tänne, jotta koko OIDC-flow (PKCE-verifier + callback + sessio) tapahtuu
// samalla originilla kuin dashboard — muuten sessionStorage/cookie ei täsmää
// (www ≠ app subdomain).
export default function AppLoginPage() {
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void startLogin();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-brand-beige p-6 text-center shadow-xl">
        <p className="text-brand-dark">Ohjataan kirjautumiseen…</p>
      </div>
    </div>
  );
}
