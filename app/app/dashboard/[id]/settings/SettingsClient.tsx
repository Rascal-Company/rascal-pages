"use client";

import { useState, useRef } from "react";
import { updateSiteDomain } from "@/app/actions/update-domain";
import { useToast } from "@/app/components/ui/ToastContainer";
import Link from "next/link";

interface SettingsClientProps {
  siteId: string;
  subdomain: string;
  initialCustomDomain: string;
  rootDomain: string;
}

export default function SettingsClient({
  siteId,
  subdomain,
  initialCustomDomain,
  rootDomain,
}: SettingsClientProps) {
  const { showToast } = useToast();
  const [customDomain, setCustomDomain] = useState(initialCustomDomain);
  const [isSaving, setIsSaving] = useState(false);
  const lastSaveRef = useRef<Date | null>(null);

  const cnameTarget = `cname.${rootDomain}`;

  const handleSave = async () => {
    // Client-side debounce: max 1 tallennus per 5 sekuntia
    const now = new Date();
    if (
      lastSaveRef.current &&
      now.getTime() - lastSaveRef.current.getTime() < 5000
    ) {
      showToast("Odota hetki ennen seuraavaa tallennusta", "error");
      return;
    }

    setIsSaving(true);
    lastSaveRef.current = now;

    try {
      const result = await updateSiteDomain(siteId, customDomain);

      if (result.error) {
        showToast(result.error, "error");
      } else {
        showToast(
          customDomain
            ? "Custom domain tallennettu onnistuneesti!"
            : "Custom domain poistettu onnistuneesti!",
          "success",
        );
      }
    } catch {
      showToast("Odottamaton virhe tapahtui. Yritä uudelleen.", "error");
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  const activeDomain = customDomain.trim() || null;

  const handleCopyName = () => {
    const nameValue = activeDomain
      ? activeDomain.split(".")[0]
      : "[subdomain-osa]";
    navigator.clipboard.writeText(nameValue);
    showToast("Name/Host kopioitu leikepöydälle!", "success");
  };

  const handleCopyTarget = () => {
    navigator.clipboard.writeText(cnameTarget);
    showToast("Value/Target kopioitu leikepöydälle!", "success");
  };

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/app/dashboard/${siteId}`}
            className="mb-4 inline-flex items-center text-sm text-brand-dark/70 hover:text-brand-dark"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Takaisin editoriin
          </Link>
          <h1 className="text-3xl font-bold text-brand-dark">
            Sivuston asetukset
          </h1>
          <p className="mt-2 text-sm text-brand-dark/70">
            Hallitse sivuston domainia ja muita asetuksia
          </p>
        </div>

        {/* Custom Domain Card */}
        <div className="rounded-lg border border-brand-dark/10 bg-brand-beige p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-brand-dark">
              Oma verkkotunnus (Custom Domain)
            </h2>
            <p className="mt-1 text-sm text-brand-dark/60">
              Käytä omaa domainiasi sivustollesi
            </p>
          </div>

          {/* Active Domain Status */}
          {activeDomain && (
            <div className="mb-4 rounded-md border border-green-200 bg-green-50 p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="mr-2 inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    ✓ Aktiivinen
                  </span>
                  <span className="text-sm font-medium text-green-900">
                    {activeDomain}
                  </span>
                </div>
                <a
                  href={`https://${activeDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-green-700 hover:text-green-900"
                >
                  Testaa →
                </a>
              </div>
            </div>
          )}

          {/* Domain Input */}
          <div className="mb-4">
            <label
              htmlFor="customDomain"
              className="mb-2 block text-sm font-medium text-brand-dark"
            >
              Custom domain
            </label>
            <input
              type="text"
              id="customDomain"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              placeholder="esim. kampanja.yritys.fi"
              className="w-full rounded-md border border-brand-dark/20 bg-white px-4 py-2 text-sm text-brand-dark outline-none transition-colors focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
            />
            <p className="mt-1 text-xs text-brand-dark/60">
              Jätä tyhjäksi poistaaksesi custom domainin
            </p>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="rounded-md bg-brand-accent px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Tallennetaan..." : "Tallenna"}
          </button>

          {/* DNS Instructions */}
          <div className="mt-6 rounded-md border border-brand-dark/20 bg-gray-50 p-4">
            <div className="mb-3 flex items-start">
              <svg
                className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-brand-dark/70"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="text-sm font-semibold text-brand-dark">
                  DNS-ohjaus vaaditaan
                </h3>
                <p className="mt-1 text-xs text-brand-dark/70">
                  Jotta custom domain toimii, sinun täytyy tehdä DNS-ohjaus
                  domain-hotellissasi.
                </p>
              </div>
            </div>

            <div className="ml-7 space-y-2 text-xs text-brand-dark/80">
              <div>
                <span className="font-semibold">1. Luo CNAME-tietue</span>
              </div>
              <div className="rounded bg-white p-3 font-mono">
                <div className="space-y-3">
                  {/* Name/Host field */}
                  <div>
                    <div className="mb-1 text-brand-dark/60">Name/Host:</div>
                    <div className="flex items-center justify-between rounded border border-brand-dark/10 bg-gray-50 px-2 py-1.5">
                      <span className="font-medium">
                        {activeDomain
                          ? activeDomain.split(".")[0]
                          : "[subdomain-osa]"}
                      </span>
                      <button
                        onClick={handleCopyName}
                        className="ml-2 rounded p-1 text-brand-dark/60 transition-colors hover:bg-white hover:text-brand-dark"
                        title="Kopioi Name/Host"
                      >
                        <svg
                          className="h-3.5 w-3.5"
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
                  {/* Value/Target field */}
                  <div>
                    <div className="mb-1 text-brand-dark/60">Value/Target:</div>
                    <div className="flex items-center justify-between rounded border border-brand-dark/10 bg-gray-50 px-2 py-1.5">
                      <span className="font-medium">{cnameTarget}</span>
                      <button
                        onClick={handleCopyTarget}
                        className="ml-2 rounded p-1 text-brand-dark/60 transition-colors hover:bg-white hover:text-brand-dark"
                        title="Kopioi Value/Target"
                      >
                        <svg
                          className="h-3.5 w-3.5"
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
                </div>
              </div>
              <div className="text-brand-dark/60">
                <span className="font-semibold">Huom:</span> DNS-muutosten
                propagoituminen voi kestää 5 minuutista 48 tuntiin.
              </div>
            </div>
          </div>

          {/* Default Subdomain */}
          <div className="mt-6 rounded-md border border-brand-dark/10 bg-white p-4">
            <h3 className="mb-2 text-sm font-medium text-brand-dark">
              Oletus subdomain
            </h3>
            <div className="flex items-center justify-between">
              <code className="text-sm text-brand-dark/80">
                {subdomain}.{rootDomain}
              </code>
              <a
                href={`https://${subdomain}.${rootDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
              >
                Avaa →
              </a>
            </div>
            <p className="mt-2 text-xs text-brand-dark/60">
              Tämä subdomain toimii aina, vaikka käyttäisit custom domainia.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
