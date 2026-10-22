"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import { useToast } from "@/app/components/ui/ToastContainer";
import { deleteOverlayCampaign, updateOverlayCampaign } from "@/app/actions/overlay";
import type { SiteId } from "@/src/lib/types";
import type { OverlayCampaignId } from "@/src/lib/overlay-campaign";
import StatusPill from "../components/StatusPill";

export default function CampaignHeader({
  siteId,
  campaignId,
  name: initialName,
  targetOrigin,
  active: initialActive,
}: {
  siteId: SiteId;
  campaignId: OverlayCampaignId;
  name: string;
  targetOrigin: string;
  active: boolean;
}) {
  const router = useRouter();
  const { showToast, showConfirm } = useToast();
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed === savedName) {
      setName(savedName);
      return;
    }
    const result = await updateOverlayCampaign(campaignId, { name: trimmed });
    if (result.success) setSavedName(trimmed);
    else {
      setName(savedName);
      showToast(result.error, "error");
    }
  }

  async function toggle(next: boolean) {
    setActive(next);
    setBusy(true);
    const result = await updateOverlayCampaign(campaignId, { active: next });
    setBusy(false);
    if (!result.success) {
      setActive(!next);
      showToast(result.error, "error");
    }
  }

  async function handleDelete() {
    const ok = await showConfirm(
      `Poistetaanko kampanja "${savedName}" ja kaikki sen laskeutumissivut, variaatiot ja tilastot?`,
      () => {},
    );
    if (!ok) return;
    setBusy(true);
    const result = await deleteOverlayCampaign(campaignId);
    if (result.success) {
      router.push(`/app/dashboard/${siteId}/overlay`);
    } else {
      setBusy(false);
      showToast(result.error, "error");
    }
  }

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={saveName}
          onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
          aria-label="Kampanjan nimi"
          className="-ml-1.5 w-full max-w-xl truncate rounded-md bg-transparent px-1.5 text-3xl font-bold leading-tight tracking-tight outline-none hover:bg-muted focus:bg-muted focus:ring-2 focus:ring-ring"
        />
        <a
          href={targetOrigin}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          {targetOrigin.replace(/^https?:\/\//, "")}
        </a>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2">
          <Switch checked={active} onCheckedChange={toggle} disabled={busy} aria-label="Kampanja aktiivinen" />
          <StatusPill tone={active ? "live" : "paused"}>{active ? "Aktiivinen" : "Pysäytetty"}</StatusPill>
        </label>
        <button
          type="button"
          onClick={handleDelete}
          disabled={busy}
          aria-label="Poista kampanja"
          title="Poista kampanja"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
    </header>
  );
}
