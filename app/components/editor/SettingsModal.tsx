"use client";

import { useState, useRef, useEffect } from "react";
import { updateSiteSettings } from "@/app/actions/update-site-settings";
import {
  updateSiteDomain,
  getSiteDomainStatus,
} from "@/app/actions/update-domain";
import type { DnsRecommendation } from "@/src/lib/vercel-domains";
import { useToast } from "@/app/components/ui/ToastContainer";
import type { SiteId } from "@/src/lib/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: SiteId;
  subdomain: string;
  rootDomain: string;
  customDomain?: string | null;
  initialSettings: {
    googleTagManagerId?: string;
    googleAnalyticsId?: string;
    metaPixelId?: string;
  };
}

export default function SettingsModal({
  isOpen,
  onClose,
  siteId,
  subdomain,
  rootDomain,
  customDomain = null,
  initialSettings,
}: SettingsModalProps) {
  const { showToast } = useToast();
  const [gtmId, setGtmId] = useState(initialSettings.googleTagManagerId || "");
  const [ga4Id, setGa4Id] = useState(initialSettings.googleAnalyticsId || "");
  const [pixelId, setPixelId] = useState(initialSettings.metaPixelId || "");
  const [isSaving, setIsSaving] = useState(false);
  const lastSaveRef = useRef<Date | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const [domainInput, setDomainInput] = useState(customDomain || "");
  const [savedDomain, setSavedDomain] = useState<string | null>(customDomain);
  const [dnsRecord, setDnsRecord] = useState<DnsRecommendation | null>(null);
  const [domainVerified, setDomainVerified] = useState<boolean | null>(null);
  const [isDomainBusy, setIsDomainBusy] = useState(false);

  const handleSaveDomain = async (clear = false) => {
    setIsDomainBusy(true);
    setDomainVerified(null);
    try {
      const result = await updateSiteDomain(siteId, clear ? "" : domainInput);
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

  // Reset form when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setGtmId(initialSettings.googleTagManagerId || "");
      setGa4Id(initialSettings.googleAnalyticsId || "");
      setPixelId(initialSettings.metaPixelId || "");
    }
  }, [isOpen, initialSettings]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Close on click outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSaveAnalytics = async () => {
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Asetukset</h2>
            <p className="mt-1 text-sm text-gray-500">
              {subdomain}.{rootDomain}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
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

        {/* Content */}
        <div className="p-6">
          {/* Site URL */}
          <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
            <h3 className="mb-2 text-sm font-medium text-gray-700">
              Sivuston osoite
            </h3>
            <div className="flex items-center justify-between">
              <code className="text-sm text-gray-600">
                {subdomain}.{rootDomain}
              </code>
              <a
                href={`https://${subdomain}.${rootDomain}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Avaa sivusto →
              </a>
            </div>
          </div>

          {/* Custom Domain Section */}
          <div className="mb-6">
            <h3 className="mb-1 text-base font-medium text-gray-900">
              Oma verkkotunnus
            </h3>
            <p className="mb-3 text-sm text-gray-500">
              Liitä oma domainisi (esim. oma-firma.fi). HTTPS luodaan
              automaattisesti, kun DNS osoittaa oikein.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="oma-firma.fi"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                onClick={() => handleSaveDomain(false)}
                disabled={isDomainBusy}
                className="shrink-0 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDomainBusy ? "..." : savedDomain ? "Päivitä" : "Tallenna"}
              </button>
            </div>

            {savedDomain && (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-gray-700">{savedDomain}</code>
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
                  <div className="mt-3 text-sm text-gray-600">
                    <p className="mb-2">
                      Lisää tämä tietue verkkotunnuksesi DNS-asetuksiin:
                    </p>
                    <div className="grid grid-cols-3 gap-2 rounded-md bg-white p-3 font-mono text-xs">
                      <div>
                        <div className="text-gray-400">Tyyppi</div>
                        <div className="text-gray-800">{dnsRecord.type}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Nimi</div>
                        <div className="text-gray-800">{dnsRecord.name}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">Arvo</div>
                        <div className="break-all text-gray-800">
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
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-50"
                  >
                    Tarkista tila
                  </button>
                  <button
                    onClick={() => handleSaveDomain(true)}
                    disabled={isDomainBusy}
                    className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Poista
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Analytics Section */}
          <div>
            <h3 className="mb-1 text-base font-medium text-gray-900">
              Analytiikka & Seuranta
            </h3>
            <p className="mb-4 text-sm text-gray-500">
              Lisää seurantapikselit markkinointia varten.
            </p>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="gtmId"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Google Tag Manager ID
                </label>
                <input
                  type="text"
                  id="gtmId"
                  value={gtmId}
                  onChange={(e) => setGtmId(e.target.value)}
                  placeholder="GTM-XXXXXX"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Löydät ID:n Google Tag Managerista (esim. GTM-ABCD123)
                </p>
              </div>

              <div>
                <label
                  htmlFor="ga4Id"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Google Analytics 4 ID
                </label>
                <input
                  type="text"
                  id="ga4Id"
                  value={ga4Id}
                  onChange={(e) => setGa4Id(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Löydät ID:n Google Analyticsista (esim. G-1J3WFE74E4)
                </p>
              </div>

              <div>
                <label
                  htmlFor="pixelId"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  Meta Pixel ID (Facebook)
                </label>
                <input
                  type="text"
                  id="pixelId"
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  placeholder="123456789012345"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Löydät Pixel ID:n Meta Business Suitesta
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
          >
            Sulje
          </button>
          <button
            onClick={handleSaveAnalytics}
            disabled={isSaving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Tallennetaan..." : "Tallenna"}
          </button>
        </div>
      </div>
    </div>
  );
}
