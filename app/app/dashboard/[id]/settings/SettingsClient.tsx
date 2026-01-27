"use client";

import { useState, useRef } from "react";
import { updateSiteSettings } from "@/app/actions/update-site-settings";
import { useToast } from "@/app/components/ui/ToastContainer";
import Link from "next/link";
import type { SiteId } from "@/src/lib/types";

interface SettingsClientProps {
  siteId: SiteId;
  subdomain: string;
  rootDomain: string;
  initialSettings: {
    googleTagManagerId?: string;
    metaPixelId?: string;
  };
}

export default function SettingsClient({
  siteId,
  subdomain,
  rootDomain,
  initialSettings,
}: SettingsClientProps) {
  const { showToast } = useToast();
  const [gtmId, setGtmId] = useState(initialSettings.googleTagManagerId || "");
  const [pixelId, setPixelId] = useState(initialSettings.metaPixelId || "");
  const [isSaving, setIsSaving] = useState(false);
  const lastSaveRef = useRef<Date | null>(null);

  const handleSaveAnalytics = async () => {
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
      const result = await updateSiteSettings(siteId, {
        googleTagManagerId: gtmId || undefined,
        metaPixelId: pixelId || undefined,
      });

      if (!result.success) {
        showToast(result.error, "error");
      } else {
        showToast("Seurantakoodit tallennettu!", "success");
      }
    } catch {
      showToast("Odottamaton virhe tapahtui. Yritä uudelleen.", "error");
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
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
            Hallitse seurantakoodeja ja muita asetuksia
          </p>
        </div>

        {/* Default Subdomain Info */}
        <div className="mb-8 rounded-lg border border-brand-dark/10 bg-white p-4">
          <h3 className="mb-2 text-sm font-medium text-brand-dark">
            Sivuston osoite
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
              Avaa sivusto →
            </a>
          </div>
        </div>

        {/* Analytiikka & Seuranta */}
        <div className="rounded-lg border border-brand-dark/10 bg-brand-beige p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-brand-dark">
              Analytiikka & Seuranta
            </h2>
            <p className="mt-1 text-sm text-brand-dark/60">
              Lisää seurantapikselit markkinointia varten. Koodit aktivoituvat
              julkaistulla sivustolla.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="gtmId"
                className="mb-1 block text-sm font-medium text-brand-dark"
              >
                Google Tag Manager ID
              </label>
              <input
                type="text"
                id="gtmId"
                value={gtmId}
                onChange={(e) => setGtmId(e.target.value)}
                placeholder="GTM-XXXXXX"
                className="w-full rounded-md border border-brand-dark/20 bg-white px-4 py-2 text-sm text-brand-dark outline-none transition-colors focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
              />
              <p className="mt-1 text-xs text-brand-dark/60">
                Löydät ID:n Google Tag Managerista (esim. GTM-ABCD123)
              </p>
            </div>

            <div>
              <label
                htmlFor="pixelId"
                className="mb-1 block text-sm font-medium text-brand-dark"
              >
                Meta Pixel ID (Facebook)
              </label>
              <input
                type="text"
                id="pixelId"
                value={pixelId}
                onChange={(e) => setPixelId(e.target.value)}
                placeholder="123456789012345"
                className="w-full rounded-md border border-brand-dark/20 bg-white px-4 py-2 text-sm text-brand-dark outline-none transition-colors focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
              />
              <p className="mt-1 text-xs text-brand-dark/60">
                Löydät Pixel ID:n Meta Business Suitesta (15-numeroinen koodi)
              </p>
            </div>

            <button
              onClick={handleSaveAnalytics}
              disabled={isSaving}
              className="mt-2 rounded-md bg-brand-accent px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Tallennetaan..." : "Tallenna koodit"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
