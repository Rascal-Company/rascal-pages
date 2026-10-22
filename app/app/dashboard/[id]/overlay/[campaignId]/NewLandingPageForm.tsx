"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="lp-name">Nimi</Label>
        <Input
          id="lp-name"
          placeholder="Esim. Rakennusliikkeet"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lp-profile">Kohderyhmä</Label>
        <select
          id="lp-profile"
          value={profileId}
          onChange={(e) => setProfileId(e.target.value)}
          className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm"
        >
          <option value="">Ei profiilia (yrityksen ihanneasiakas)</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lp-path">Polku</Label>
        <Input id="lp-path" value={path} onChange={(e) => setPath(e.target.value)} />
        <p className="text-xs text-muted-foreground">
          Sivulle syntyy valmis mainoslinkki, jonka voit kopioida editorista.
        </p>
      </div>
      <details className="group rounded-md border border-border px-3 py-2 text-sm">
        <summary className="cursor-pointer select-none text-muted-foreground">Lisäasetukset</summary>
        <div className="mt-3 space-y-1.5">
          <Label htmlFor="lp-term">Kohdenna utm_term-arvolla</Label>
          <Input
            id="lp-term"
            placeholder="esim. rakennus"
            value={utmTerm}
            onChange={(e) => setUtmTerm(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Käynnissä oleville mainoksille, joiden linkkiä ei haluta vaihtaa, tai Google Adsin
            hakusanalle ({"{keyword}"}). Korvaa valmiin linkin.
          </p>
        </div>
      </details>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy || !name.trim()} className="w-full">
        {busy && <Loader2 className="animate-spin" aria-hidden />}
        {busy ? "Avataan editoria…" : "Luo ja avaa editori"}
      </Button>
    </form>
  );
}
