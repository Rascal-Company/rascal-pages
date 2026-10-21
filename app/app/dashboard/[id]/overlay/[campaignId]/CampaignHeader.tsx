"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Switch } from "@/app/components/ui/switch";
import { deleteOverlayCampaign, updateOverlayCampaign } from "@/app/actions/overlay";
import type { SiteId } from "@/src/lib/types";
import type { OverlayCampaignId } from "@/src/lib/overlay-campaign";

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
  const [name, setName] = useState(initialName);
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function save(patch: { name?: string; active?: boolean }) {
    setBusy(true);
    setError(null);
    const result = await updateOverlayCampaign(campaignId, patch);
    setBusy(false);
    if (!result.success) setError(result.error);
    return result.success;
  }

  async function toggle(next: boolean) {
    setActive(next);
    if (!(await save({ active: next }))) setActive(!next);
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    const result = await deleteOverlayCampaign(campaignId);
    if (result.success) {
      router.push(`/app/dashboard/${siteId}/overlay`);
    } else {
      setBusy(false);
      setError(result.error);
    }
  }

  return (
    <section className="rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name.trim() && name !== initialName && save({ name })}
            className="h-10 max-w-md text-2xl font-bold"
            aria-label="Kampanjan nimi"
          />
          <a
            href={targetOrigin}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm text-brand-dark/60 hover:text-brand-dark"
          >
            <ExternalLink className="size-3" aria-hidden />
            {targetOrigin.replace(/^https?:\/\//, "")}
          </a>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-brand-dark/80">
            <Switch checked={active} onCheckedChange={toggle} disabled={busy} />
            {active ? "Aktiivinen" : "Pysäytetty"}
          </label>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDelete}
            disabled={busy}
            className="border-red-300 text-red-600 hover:bg-red-50"
          >
            {confirmDelete ? "Vahvista poisto" : "Poista"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </section>
  );
}
