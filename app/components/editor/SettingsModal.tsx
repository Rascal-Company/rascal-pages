"use client";

import { useState, useRef, useEffect } from "react";
import { updateSiteSettings } from "@/app/actions/update-site-settings";
import { useToast } from "@/app/components/ui/ToastContainer";
import type { SiteId } from "@/src/lib/types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  siteId: SiteId;
  subdomain: string;
  rootDomain: string;
  initialSettings: {
    googleTagManagerId?: string;
    metaPixelId?: string;
  };
}

export default function SettingsModal({
  isOpen,
  onClose,
  siteId,
  subdomain,
  rootDomain,
  initialSettings,
}: SettingsModalProps) {
  const { showToast } = useToast();
  const [gtmId, setGtmId] = useState(initialSettings.googleTagManagerId || "");
  const [pixelId, setPixelId] = useState(initialSettings.metaPixelId || "");
  const [isSaving, setIsSaving] = useState(false);
  const lastSaveRef = useRef<Date | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens with new initial values
  useEffect(() => {
    if (isOpen) {
      setGtmId(initialSettings.googleTagManagerId || "");
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
