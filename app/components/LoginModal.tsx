"use client";

import { useState } from "react";
import { startLogin } from "@/src/lib/oidc";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Kirjautuminen kulkee keskitetysti Rascal ID:n (id.rascalai.fi) kautta.
// Ei omaa salasana-UI:ta — nappi ohjaa OIDC-flowhun (ks. src/lib/oidc.ts).
export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLogin = () => {
    setLoading(true);
    void startLogin();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-brand-beige shadow-xl">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-brand-dark">Kirjaudu sisään</h2>
            <button
              onClick={onClose}
              className="text-brand-dark/60 transition-colors hover:text-brand-dark"
              aria-label="Close"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <p className="mb-6 text-sm text-brand-dark/70">
            Käytä Rascal-tiliäsi — sama tili kaikkiin Rascal-tuotteisiin.
          </p>

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Ohjataan…" : "Kirjaudu Rascal ID:llä"}
          </button>
        </div>
      </div>
    </div>
  );
}
