"use client";

import { useState, useRef } from "react";
import { updateSiteSettings } from "@/app/actions/update-site-settings";
import {
  updateSiteDomain,
  getSiteDomainStatus,
} from "@/app/actions/update-domain";
import {
  createApiKey,
  revokeApiKey,
  type ApiKeySummary,
} from "@/app/actions/api-keys";
import type { DnsRecommendation } from "@/src/lib/vercel-domains";
import { useToast } from "@/app/components/ui/ToastContainer";
import Link from "next/link";
import type { SiteId } from "@/src/lib/types";
import { Button } from "@/app/components/ui/button";

type SectionId = "general" | "domain" | "analytics" | "apikeys" | "blog";

const SECTIONS: { id: SectionId; label: string }[] = [
  { id: "general", label: "Yleiset" },
  { id: "domain", label: "Verkkotunnus" },
  { id: "analytics", label: "Analytiikka" },
  { id: "apikeys", label: "API-avaimet" },
  { id: "blog", label: "Blogi" },
];

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
  initialApiKeys: ApiKeySummary[];
}

const inputClass =
  "w-full rounded-md border border-brand-dark/20 bg-card px-4 py-2 text-sm text-brand-dark outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20";

const POSTS_ENDPOINT = "https://app.rascalpages.fi/api/posts";

export default function SettingsClient({
  siteId,
  subdomain,
  rootDomain,
  customDomain,
  initialSettings,
  initialApiKeys,
}: SettingsClientProps) {
  const { showToast } = useToast();
  const [activeSection, setActiveSection] = useState<SectionId>("general");

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/app/dashboard/${siteId}`}
            className="mb-4 inline-flex items-center text-sm text-brand-dark/70 hover:text-brand-dark"
          >
            ← Takaisin editoriin
          </Link>
          <h1 className="text-3xl font-bold text-brand-dark">
            Sivuston asetukset
          </h1>
          <p className="mt-2 text-sm text-brand-dark/70">
            {subdomain}.{rootDomain}
          </p>
        </div>

        <div className="flex flex-col gap-8 md:flex-row">
          {/* Osionavigaatio */}
          <nav className="flex shrink-0 gap-1 overflow-x-auto md:w-48 md:flex-col">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`whitespace-nowrap rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  activeSection === section.id
                    ? "bg-primary text-white"
                    : "text-brand-dark/70 hover:bg-card hover:text-brand-dark"
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>

          {/* Aktiivisen osion sisältö */}
          <div className="min-w-0 flex-1">
            {activeSection === "general" && (
              <GeneralSection subdomain={subdomain} rootDomain={rootDomain} />
            )}
            {activeSection === "domain" && (
              <DomainSection
                siteId={siteId}
                customDomain={customDomain}
                showToast={showToast}
              />
            )}
            {activeSection === "analytics" && (
              <AnalyticsSection
                siteId={siteId}
                initialSettings={initialSettings}
                showToast={showToast}
              />
            )}
            {activeSection === "apikeys" && (
              <ApiKeysSection
                siteId={siteId}
                initialApiKeys={initialApiKeys}
                showToast={showToast}
              />
            )}
            {activeSection === "blog" && <BlogSection siteId={siteId} />}
          </div>
        </div>
      </div>
    </div>
  );
}

type ShowToast = ReturnType<typeof useToast>["showToast"];

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-brand-dark">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-brand-dark/60">{description}</p>
      )}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function GeneralSection({
  subdomain,
  rootDomain,
}: {
  subdomain: string;
  rootDomain: string;
}) {
  return (
    <SectionCard
      title="Sivuston osoite"
      description="Oletusosoite rascalpages.fi-alidomainissa."
    >
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
    </SectionCard>
  );
}

function DomainSection({
  siteId,
  customDomain,
  showToast,
}: {
  siteId: SiteId;
  customDomain: string | null;
  showToast: ShowToast;
}) {
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

  return (
    <SectionCard
      title="Oma verkkotunnus"
      description="Liitä oma domainisi (esim. oma-firma.fi). HTTPS-sertti luodaan automaattisesti, kun DNS osoittaa oikein."
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          placeholder="oma-firma.fi"
          className={inputClass}
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
            <code className="text-sm text-brand-dark/80">{savedDomain}</code>
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
    </SectionCard>
  );
}

function AnalyticsSection({
  siteId,
  initialSettings,
  showToast,
}: {
  siteId: SiteId;
  initialSettings: SettingsClientProps["initialSettings"];
  showToast: ShowToast;
}) {
  const [gtmId, setGtmId] = useState(initialSettings.googleTagManagerId || "");
  const [ga4Id, setGa4Id] = useState(initialSettings.googleAnalyticsId || "");
  const [pixelId, setPixelId] = useState(initialSettings.metaPixelId || "");
  const [isSaving, setIsSaving] = useState(false);
  const lastSaveRef = useRef<Date | null>(null);

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
    <SectionCard
      title="Analytiikka & Seuranta"
      description="Lisää seurantapikselit markkinointia varten. Koodit aktivoituvat julkaistulla sivustolla."
    >
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
            className={inputClass}
          />
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
            className={inputClass}
          />
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
            className={inputClass}
          />
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
    </SectionCard>
  );
}

function ApiKeysSection({
  siteId,
  initialApiKeys,
  showToast,
}: {
  siteId: SiteId;
  initialApiKeys: ApiKeySummary[];
  showToast: ShowToast;
}) {
  const [keys, setKeys] = useState<ApiKeySummary[]>(initialApiKeys);
  const [name, setName] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [freshKey, setFreshKey] = useState<string | null>(null);

  const activeKeys = keys.filter((k) => !k.revokedAt);

  const handleCreate = async () => {
    if (!name.trim()) {
      showToast("Anna avaimelle nimi.", "error");
      return;
    }
    setIsBusy(true);
    setFreshKey(null);
    try {
      const result = await createApiKey(siteId, name);
      if (result.success) {
        setKeys((prev) => [result.key, ...prev]);
        setFreshKey(result.raw);
        setName("");
        showToast(
          "API-avain luotu. Kopioi se nyt — sitä ei näytetä uudelleen.",
          "success",
        );
      } else {
        showToast(result.error, "error");
      }
    } catch {
      showToast("Odottamaton virhe. Yritä uudelleen.", "error");
    } finally {
      setIsBusy(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    setIsBusy(true);
    try {
      const result = await revokeApiKey(siteId, keyId);
      if (result.success) {
        setKeys((prev) =>
          prev.map((k) =>
            k.id === keyId ? { ...k, revokedAt: new Date().toISOString() } : k,
          ),
        );
        showToast("Avain peruutettu.", "success");
      } else {
        showToast(result.error, "error");
      }
    } catch {
      showToast("Odottamaton virhe. Yritä uudelleen.", "error");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <SectionCard
      title="API-avaimet"
      description="Org-tasoinen avain, jolla voi julkaista blogipostauksia /api/posts-rajapintaan omasta automaatiosta. Avain toimii kaikille organisaation sivustoille; anna site_id pyynnössä."
    >
      {freshKey && (
        <div className="mb-4 rounded-md border border-green-300 bg-green-50 p-4">
          <p className="text-sm font-medium text-green-900">
            Uusi avain (näytetään vain kerran):
          </p>
          <code className="mt-2 block break-all rounded bg-card p-2 text-xs text-brand-dark">
            {freshKey}
          </code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(freshKey);
              showToast("Avain kopioitu leikepöydälle!", "success");
            }}
            className="mt-2 text-sm font-medium text-primary hover:text-primary-hover"
          >
            Kopioi avain
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Avaimen nimi (esim. n8n-tuotanto)"
          className={inputClass}
        />
        <Button
          onClick={handleCreate}
          disabled={isBusy}
          size="lg"
          className="shrink-0"
        >
          {isBusy ? "..." : "Luo avain"}
        </Button>
      </div>

      {activeKeys.length > 0 && (
        <ul className="mt-4 space-y-2">
          {activeKeys.map((key) => (
            <li
              key={key.id}
              className="flex items-center justify-between rounded-md border border-brand-dark/10 bg-brand-light p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-brand-dark">
                  {key.name}
                </p>
                <code className="text-xs text-brand-dark/60">
                  {key.keyPrefix}…
                  {key.lastUsedAt ? " · käytetty" : " · ei käytetty"}
                </code>
              </div>
              <button
                onClick={() => handleRevoke(key.id)}
                disabled={isBusy}
                className="shrink-0 text-sm font-medium text-destructive hover:text-destructive/90 disabled:opacity-50"
              >
                Peruuta
              </button>
            </li>
          ))}
        </ul>
      )}

      <ApiUsageExamples
        siteId={siteId}
        apiKey={freshKey}
        showToast={showToast}
      />
    </SectionCard>
  );
}

function ApiUsageExamples({
  siteId,
  apiKey,
  showToast,
}: {
  siteId: SiteId;
  apiKey: string | null;
  showToast: ShowToast;
}) {
  const keyValue = apiKey ?? "<API_AVAIN>";

  const curlSnippet = `curl -X POST ${POSTS_ENDPOINT} \\
  -H "Authorization: Bearer ${keyValue}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "siteId": "${siteId}",
    "title": "Ensimmäinen postaus",
    "content": "Postauksen sisältö…",
    "published": true
  }'`;

  const pythonSnippet = `import requests

resp = requests.post(
    "${POSTS_ENDPOINT}",
    headers={"Authorization": "Bearer ${keyValue}"},
    json={
        "siteId": "${siteId}",
        "title": "Ensimmäinen postaus",
        "content": "Postauksen sisältö…",
        "published": True,
    },
)
resp.raise_for_status()
print(resp.json())`;

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast("Kopioitu leikepöydälle!", "success");
  };

  return (
    <div className="mt-6 border-t border-brand-dark/10 pt-4">
      <h3 className="text-sm font-semibold text-brand-dark">
        Käyttö automaatiosta
      </h3>
      <p className="mt-1 text-xs text-brand-dark/60">
        <code>POST {POSTS_ENDPOINT}</code> otsikolla{" "}
        <code>Authorization: Bearer &lt;avain&gt;</code>. Pakolliset kentät:{" "}
        <code>siteId</code>, <code>title</code>. Valinnaiset: <code>slug</code>,{" "}
        <code>excerpt</code>, <code>coverImage</code>, <code>published</code>,{" "}
        <code>publishedAt</code>, <code>seoTitle</code>,{" "}
        <code>seoDescription</code>. Sama (siteId, slug) päivittää olemassa
        olevan postauksen.
        {!apiKey && (
          <>
            {" "}
            Esimerkeissä <code>&lt;API_AVAIN&gt;</code> — korvaa luomallasi
            avaimella.
          </>
        )}
      </p>
      <CodeSnippet label="curl" code={curlSnippet} onCopy={copy} />
      <CodeSnippet
        label="Python (requests)"
        code={pythonSnippet}
        onCopy={copy}
      />
    </div>
  );
}

function CodeSnippet({
  label,
  code,
  onCopy,
}: {
  label: string;
  code: string;
  onCopy: (code: string) => void;
}) {
  return (
    <div className="mt-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs font-medium text-brand-dark/70">{label}</span>
        <button
          onClick={() => onCopy(code)}
          className="text-xs font-medium text-primary hover:text-primary-hover"
        >
          Kopioi
        </button>
      </div>
      <pre className="overflow-x-auto rounded-md bg-brand-dark p-3 text-xs leading-relaxed text-white">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function BlogSection({ siteId }: { siteId: SiteId }) {
  return (
    <SectionCard
      title="Blogi"
      description="Kirjoita ja julkaise blogipostauksia, tai julkaise automaatiosta API-avaimella."
    >
      <Link
        href={`/app/dashboard/${siteId}/posts`}
        className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
      >
        Avaa blogieditori →
      </Link>
    </SectionCard>
  );
}
