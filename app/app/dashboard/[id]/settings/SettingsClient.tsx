"use client";

import { useState, useRef } from "react";
import { updateSiteSettings } from "@/app/actions/update-site-settings";
import {
  updateSiteDomain,
  getSiteDomainStatus,
} from "@/app/actions/update-domain";
import type { DnsRecommendation } from "@/src/lib/vercel-domains";
import { useToast } from "@/app/components/ui/ToastContainer";
import Link from "next/link";
import type { SiteId } from "@/src/lib/types";
import { Button } from "@/app/components/ui/button";

interface SettingsClientProps {
  siteId: SiteId;
  subdomain: string;
  rootDomain: string;
  customDomain: string | null;
  initialSettings: {
    googleTagManagerId?: string;
    googleAnalyticsId?: string;
    metaPixelId?: string;
  };
}

export default function SettingsClient({
  siteId,
  subdomain,
  rootDomain,
  customDomain,
  initialSettings,
}: SettingsClientProps) {
  const { showToast } = useToast();
  const [gtmId, setGtmId] = useState(initialSettings.googleTagManagerId || "");
  const [ga4Id, setGa4Id] = useState(initialSettings.googleAnalyticsId || "");
  const [pixelId, setPixelId] = useState(initialSettings.metaPixelId || "");
  const [isSaving, setIsSaving] = useState(false);
  const lastSaveRef = useRef<Date | null>(null);

  const [domainInput, setDomainInput] = useState(customDomain || "");
  const [savedDomain, setSavedDomain] = useState<string | null>(customDomain);
  const [dnsRecord, setDnsRecord] = useState<DnsRecommendation | null>(null);
  const [domainVerified, setDomainVerified] = useState<boolean | null>(null);
  const [isDomainBusy, setIsDomainBusy] = useState(false);

  const handleSaveDomain = async () => {
    setIsDomainBusy(true);
    setDomainVerified(null);
    try {
      const result = await updateSiteDomain(siteId, domainInput);
      if (result.error && !result.domain) {
        showToast(result.error, "error");
        return;
      }
      if (result.error) showToast(result.error, "error");
      setSavedDomain(result.domain ?? null);
      setDnsRecord(result.record ?? null);
      if (result.domain) {
        showToast("Verkkotunnus tallennettu. Lisää DNS-tietue.", "success");
      } else {
        showToast("Verkkotunnus poistettu.", "success");
        setDomainInput("");
      }
    } catch {
      showToast("Odottamaton virhe. Yritä uudelleen.", "error");
    } finally {
      setIsDomainBusy(false);
    }
  };

  const handleCheckDomain = async () => {
    setIsDomainBusy(true);
    try {
      const status = await getSiteDomainStatus(siteId);
      if (status.error) {
        showToast(status.error, "error");
        return;
      }
      setDomainVerified(status.verified ?? false);
      if (status.record) setDnsRecord(status.record);
      showToast(
        status.verified
          ? "Verkkotunnus on aktiivinen!"
          : "Odottaa vielä DNS:ää.",
        status.verified ? "success" : "error",
      );
    } catch {
      showToast("Tarkistus epäonnistui.", "error");
    } finally {
      setIsDomainBusy(false);
    }
  };

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
        googleAnalyticsId: ga4Id || undefined,
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
        <div className="mb-8 rounded-lg border border-brand-dark/10 bg-card p-4">
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
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              Avaa sivusto →
            </a>
          </div>
        </div>

        {/* Oma verkkotunnus */}
        <div className="mb-8 rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-brand-dark">
            Oma verkkotunnus
          </h2>
          <p className="mt-1 text-sm text-brand-dark/60">
            Liitä oma domainisi (esim. oma-firma.fi). HTTPS-sertti luodaan
            automaattisesti, kun DNS osoittaa oikein.
          </p>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              placeholder="oma-firma.fi"
              className="w-full rounded-md border border-brand-dark/20 bg-card px-4 py-2 text-sm text-brand-dark outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
            />
            <Button
              onClick={handleSaveDomain}
              disabled={isDomainBusy}
              size="lg"
              className="shrink-0"
            >
              {isDomainBusy ? "..." : savedDomain ? "Päivitä" : "Tallenna"}
            </Button>
          </div>

          {savedDomain && (
            <div className="mt-4 rounded-md border border-brand-dark/10 bg-brand-light p-4">
              <div className="flex items-center justify-between">
                <code className="text-sm text-brand-dark/80">
                  {savedDomain}
                </code>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    domainVerified
                      ? "bg-green-100 text-green-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {domainVerified ? "Aktiivinen" : "Odottaa DNS:ää"}
                </span>
              </div>

              {dnsRecord && !domainVerified && (
                <div className="mt-3 text-sm text-brand-dark/70">
                  <p className="mb-2">
                    Lisää tämä tietue verkkotunnuksesi DNS-asetuksiin:
                  </p>
                  <div className="grid grid-cols-3 gap-2 rounded-md bg-card p-3 font-mono text-xs">
                    <div>
                      <div className="text-brand-dark/40">Tyyppi</div>
                      <div className="text-brand-dark">{dnsRecord.type}</div>
                    </div>
                    <div>
                      <div className="text-brand-dark/40">Nimi</div>
                      <div className="text-brand-dark">{dnsRecord.name}</div>
                    </div>
                    <div>
                      <div className="text-brand-dark/40">Arvo</div>
                      <div className="break-all text-brand-dark">
                        {dnsRecord.value}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 flex gap-4">
                <button
                  onClick={handleCheckDomain}
                  disabled={isDomainBusy}
                  className="text-sm font-medium text-primary hover:text-primary-hover disabled:opacity-50"
                >
                  Tarkista tila
                </button>
                <button
                  onClick={() => {
                    setDomainInput("");
                    void handleSaveDomain();
                  }}
                  disabled={isDomainBusy}
                  className="text-sm font-medium text-destructive hover:text-destructive/90 disabled:opacity-50"
                >
                  Poista verkkotunnus
                </button>
              </div>
            </div>
          )}
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
                className="w-full rounded-md border border-brand-dark/20 bg-card px-4 py-2 text-sm text-brand-dark outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <p className="mt-1 text-xs text-brand-dark/60">
                Löydät ID:n Google Tag Managerista (esim. GTM-ABCD123)
              </p>
            </div>

            <div>
              <label
                htmlFor="ga4Id"
                className="mb-1 block text-sm font-medium text-brand-dark"
              >
                Google Analytics 4 ID
              </label>
              <input
                type="text"
                id="ga4Id"
                value={ga4Id}
                onChange={(e) => setGa4Id(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full rounded-md border border-brand-dark/20 bg-card px-4 py-2 text-sm text-brand-dark outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <p className="mt-1 text-xs text-brand-dark/60">
                Löydät ID:n Google Analyticsista (esim. G-1J3WFE74E4)
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
                className="w-full rounded-md border border-brand-dark/20 bg-card px-4 py-2 text-sm text-brand-dark outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20"
              />
              <p className="mt-1 text-xs text-brand-dark/60">
                Löydät Pixel ID:n Meta Business Suitesta (15-numeroinen koodi)
              </p>
            </div>

            <Button
              onClick={handleSaveAnalytics}
              disabled={isSaving}
              size="lg"
              className="mt-2"
            >
              {isSaving ? "Tallennetaan..." : "Tallenna koodit"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
