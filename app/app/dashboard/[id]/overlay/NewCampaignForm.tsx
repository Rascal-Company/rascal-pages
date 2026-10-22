"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import SegmentedControl from "@/app/components/ui/segmented-control";
import { createOverlayCampaign } from "@/app/actions/overlay";
import type { SiteId } from "@/src/lib/types";
import type { PagesTarget } from "./overlay-data";

type TargetKind = "pages" | "external";

export default function NewCampaignForm({
  siteId,
  pagesTargets,
}: {
  siteId: SiteId;
  pagesTargets: PagesTarget[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<TargetKind>(pagesTargets.length > 0 ? "pages" : "external");
  const [pagesSiteId, setPagesSiteId] = useState(pagesTargets[0]?.id ?? "");
  const [targetUrl, setTargetUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createOverlayCampaign(
      siteId,
      kind === "pages" ? { name, targetUrl: "", pagesSiteId } : { name, targetUrl },
    );
    if (result.success) {
      const { campaignId, landingPageId } = result.data;
      router.push(`/app/dashboard/${siteId}/overlay/${campaignId}/${landingPageId}`);
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="campaign-name">Nimi</Label>
        <Input
          id="campaign-name"
          placeholder="Esim. Syksy 2026"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      {pagesTargets.length > 0 && (
        <SegmentedControl
          ariaLabel="Kampanjan kohde"
          value={kind}
          onChange={setKind}
          className="w-full"
          options={[
            { value: "pages" as const, label: "Oma Pages-sivu" },
            { value: "external" as const, label: "Ulkoinen sivusto" },
          ]}
        />
      )}
      {kind === "pages" ? (
        <div className="space-y-1.5">
          <Label htmlFor="campaign-pages-site">Pages-sivu</Label>
          <select
            id="campaign-pages-site"
            value={pagesSiteId}
            onChange={(e) => setPagesSiteId(e.target.value)}
            className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
          >
            {pagesTargets.map((target) => (
              <option key={target.id} value={target.id}>
                {target.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            Asennusta ei tarvita: variaatio näytetään suoraan sivulla ilman välähdystä.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <Label htmlFor="campaign-url">Asiakkaan sivu</Label>
          <Input
            id="campaign-url"
            inputMode="url"
            placeholder="https://asiakas.fi/hinnasto"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Sivu avautuu editoriin heti — asennusta tarvitaan vasta tuotantoon.
          </p>
        </div>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || !name.trim() || (kind === "pages" ? !pagesSiteId : !targetUrl.trim())} className="w-full">
        {busy && <Loader2 className="animate-spin" aria-hidden />}
        {busy ? "Avataan editoria…" : "Luo ja avaa editori"}
      </Button>
    </form>
  );
}
