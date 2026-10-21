"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        placeholder="Kampanjan nimi, esim. Syksy 2026"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="sm:max-w-xs"
      />
      <Input
        placeholder="https://asiakas.fi/hinnasto"
        value={targetUrl}
        onChange={(e) => setTargetUrl(e.target.value)}
      />
      <Button type="submit" disabled={busy || !name || !targetUrl} className="shrink-0">
        {busy ? "Luodaan…" : "Luo ja avaa editori"}
      </Button>
      {error && <p className="text-sm text-red-600 sm:basis-full">{error}</p>}
    </form>
  );
}
