'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createSite } from '@/app/actions';

export default function NewSitePage() {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await createSite(formData);

      // Jos palautetaan error, näytetään se
      // Jos ei erroria, Server Action tekee redirectin automaattisesti
      if (result?.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // Redirect tapahtuu Server Actionissa automaattisesti onnistuessa
    } catch (err) {
      setError('Odottamaton virhe. Yritä uudelleen.');
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Otsikko */}
        <div className="mb-8">
          <Link
            href="/app/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Takaisin dashboardiin
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-gray-900">
            Uusi sivusto
          </h1>
          <p className="mt-2 text-gray-600">
            Luo uusi sivusto valitsemalla subdomain
          </p>
        </div>

        {/* Lomake */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <form action={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="subdomain"
                className="block text-sm font-medium text-gray-700"
              >
                Subdomain
              </label>
              <div className="mt-2 flex rounded-md shadow-sm">
                <input
                  type="text"
                  id="subdomain"
                  name="subdomain"
                  required
                  pattern="[a-zA-Z0-9]+"
                  disabled={isSubmitting}
                  className="block w-full rounded-l-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-brand-accent focus:outline-none focus:ring-brand-accent disabled:bg-gray-100 disabled:cursor-not-allowed sm:text-sm"
                  placeholder="esimerkki"
                />
                <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 bg-gray-50 px-3 text-sm text-gray-500">
                  .rascalpages.fi
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Subdomain voi sisältää vain kirjaimia ja numeroita
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 rounded-md bg-brand-accent px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-accent-hover focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 disabled:bg-brand-accent/60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Luodaan...' : 'Luo sivusto'}
              </button>
              <Link
                href="/app/dashboard"
                className="flex-1 rounded-md border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2"
              >
                Peruuta
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
