"use client";

import { useState, useRef, useEffect } from "react";
import { updateSiteSettings } from "@/app/actions/update-site-settings";
import {
  updateSiteDomain,
  getSiteDomainStatus,
} from "@/app/actions/update-domain";
import type { DnsRecommendation } from "@/src/lib/vercel-domains";
import { useToast } from "@/app/components/ui/ToastContainer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asetukset</DialogTitle>
          <DialogDescription>
            {subdomain}.{rootDomain}
          </DialogDescription>
        </DialogHeader>

        {/* Content */}
        <div>
          {/* Site URL */}
          <div className="mb-6 rounded-lg border border-border bg-muted p-4">
            <h3 className="mb-2 text-sm font-medium text-foreground">
              Sivuston osoite
            </h3>
            <div className="flex items-center justify-between">
              <code className="text-sm text-muted-foreground">
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

          {/* Custom Domain Section */}
          <div className="mb-6">
            <h3 className="mb-1 text-base font-medium text-foreground">
              Oma verkkotunnus
            </h3>
            <p className="mb-3 text-sm text-muted-foreground">
              Liitä oma domainisi (esim. oma-firma.fi). HTTPS luodaan
              automaattisesti, kun DNS osoittaa oikein.
            </p>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                placeholder="oma-firma.fi"
                className="w-full"
              />
              <Button
                onClick={() => handleSaveDomain(false)}
                disabled={isDomainBusy}
                className="shrink-0"
              >
                {isDomainBusy ? "..." : savedDomain ? "Päivitä" : "Tallenna"}
              </Button>
            </div>

            {savedDomain && (
              <div className="mt-3 rounded-lg border border-border bg-muted p-4">
                <div className="flex items-center justify-between">
                  <code className="text-sm text-foreground">{savedDomain}</code>
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
                  <div className="mt-3 text-sm text-muted-foreground">
                    <p className="mb-2">
                      Lisää tämä tietue verkkotunnuksesi DNS-asetuksiin:
                    </p>
                    <div className="grid grid-cols-3 gap-2 rounded-md bg-card p-3 font-mono text-xs">
                      <div>
                        <div className="text-muted-foreground">Tyyppi</div>
                        <div className="text-foreground">{dnsRecord.type}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Nimi</div>
                        <div className="text-foreground">{dnsRecord.name}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Arvo</div>
                        <div className="break-all text-foreground">
                          {dnsRecord.value}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3 flex gap-4">
                  <Button
                    variant="outline"
                    onClick={handleCheckDomain}
                    disabled={isDomainBusy}
                  >
                    Tarkista tila
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => handleSaveDomain(true)}
                    disabled={isDomainBusy}
                  >
                    Poista
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Analytics Section */}
          <div>
            <h3 className="mb-1 text-base font-medium text-foreground">
              Analytiikka & Seuranta
            </h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Lisää seurantapikselit markkinointia varten.
            </p>

            <div className="space-y-4">
              <div>
                <Label htmlFor="gtmId" className="mb-1 block">
                  Google Tag Manager ID
                </Label>
                <Input
                  type="text"
                  id="gtmId"
                  value={gtmId}
                  onChange={(e) => setGtmId(e.target.value)}
                  placeholder="GTM-XXXXXX"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Löydät ID:n Google Tag Managerista (esim. GTM-ABCD123)
                </p>
              </div>

              <div>
                <Label htmlFor="ga4Id" className="mb-1 block">
                  Google Analytics 4 ID
                </Label>
                <Input
                  type="text"
                  id="ga4Id"
                  value={ga4Id}
                  onChange={(e) => setGa4Id(e.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Löydät ID:n Google Analyticsista (esim. G-1J3WFE74E4)
                </p>
              </div>

              <div>
                <Label htmlFor="pixelId" className="mb-1 block">
                  Meta Pixel ID (Facebook)
                </Label>
                <Input
                  type="text"
                  id="pixelId"
                  value={pixelId}
                  onChange={(e) => setPixelId(e.target.value)}
                  placeholder="123456789012345"
                  className="w-full"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Löydät Pixel ID:n Meta Business Suitesta
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Sulje
          </Button>
          <Button onClick={handleSaveAnalytics} disabled={isSaving}>
            {isSaving ? "Tallennetaan..." : "Tallenna"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
