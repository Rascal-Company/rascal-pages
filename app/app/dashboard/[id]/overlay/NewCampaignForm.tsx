"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { createOverlayCampaign } from "@/app/actions/overlay";
import type { SiteId } from "@/src/lib/types";

export default function NewCampaignForm({ siteId }: { siteId: SiteId }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createOverlayCampaign(siteId, { name, targetUrl });
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
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || !name.trim() || !targetUrl.trim()} className="w-full">
        {busy && <Loader2 className="animate-spin" aria-hidden />}
        {busy ? "Avataan editoria…" : "Luo ja avaa editori"}
      </Button>
    </form>
  );
}
