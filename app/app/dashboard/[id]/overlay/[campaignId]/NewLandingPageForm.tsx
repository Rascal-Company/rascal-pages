"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { createOverlayLandingPage, type OverlayProfile } from "@/app/actions/overlay";
import type { SiteId } from "@/src/lib/types";
import type { OverlayCampaignId } from "@/src/lib/overlay-campaign";

export default function NewLandingPageForm({
  siteId,
  campaignId,
  profiles,
}: {
  siteId: SiteId;
  campaignId: OverlayCampaignId;
  profiles: OverlayProfile[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [path, setPath] = useState("/");
  const [utmTerm, setUtmTerm] = useState("");
  const [profileId, setProfileId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await createOverlayLandingPage(campaignId, {
      name,
      path,
      utmTerm,
      profileId: profileId || null,
    });
    if (result.success) {
      router.push(`/app/dashboard/${siteId}/overlay/${campaignId}/${result.data.landingPageId}`);
    } else {
      setError(result.error);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-2 sm:grid-cols-2">
      <Input
        placeholder="Nimi, esim. Rakennusliikkeet – syyskampanja"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Input
        placeholder="Polku, esim. / tai /hinnasto"
        value={path}
        onChange={(e) => setPath(e.target.value)}
      />
      <Input
        placeholder="utm_term, esim. rakennus"
        value={utmTerm}
        onChange={(e) => setUtmTerm(e.target.value)}
      />
      <select
        value={profileId}
        onChange={(e) => setProfileId(e.target.value)}
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        aria-label="Kohderyhmäprofiili"
      >
        <option value="">Ei profiilia</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      <Button type="submit" disabled={busy || !name.trim()} className="sm:col-span-2">
        {busy ? "Luodaan…" : "Luo ja avaa editori"}
      </Button>
      {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
    </form>
  );
}
