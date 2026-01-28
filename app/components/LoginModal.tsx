"use client";

import { useState } from "react";
import { createClient } from "@/src/utils/supabase/client";
import { getAppUrl } from "@/app/lib/navigation";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword(
        {
          email,
          password,
        },
      );

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.session) {
        // Sulje modal
        onClose();
        setLoading(false);

        // Ohjaa dashboardiin - getAppUrl hoitaa localhost/tuotanto -eron
        window.location.href = getAppUrl("/app/dashboard");
      }
    } catch (err) {
      setError("Odottamaton virhe tapahtui. Yritä uudelleen.");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-brand-beige shadow-xl">
        <div className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-brand-dark">
              Kirjaudu sisään
            </h2>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-brand-dark"
              >
                Sähköposti
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-brand-dark/20 bg-white px-3 py-2 text-brand-dark shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-brand-dark"
              >
                Salasana
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-md border border-brand-dark/20 bg-white px-3 py-2 text-brand-dark shadow-sm focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-brand-accent px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Kirjaudutaan..." : "Kirjaudu sisään"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
