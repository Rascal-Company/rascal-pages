"use client";

import { useState } from "react";
import { Building2, Plus, Sparkles, Trash2, UserRound, UsersRound, type LucideIcon } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { useToast } from "@/app/components/ui/ToastContainer";
import {
  createOverlayProfile,
  deleteOverlayProfile,
  importCrmSegmentProfile,
  importRascalProfile,
  updateOverlayProfile,
  type OverlayProfile,
} from "@/app/actions/overlay";

type CrmSegment = { id: string; name: string; totalContacts: number };
type ActionResult = { success: true; data: OverlayProfile } | { success: false; error: string };

const SOURCES: Record<OverlayProfile["source"], { label: string; icon: LucideIcon }> = {
  custom: { label: "Oma", icon: UserRound },
  rascal_ai: { label: "Rascal AI", icon: Sparkles },
  crm_segment: { label: "CRM-segmentti", icon: Building2 },
};

function ProfileCard({
  profile,
  onChange,
  onDelete,
}: {
  profile: OverlayProfile;
  onChange: (p: OverlayProfile) => void;
  onDelete: () => void;
}) {
  const { showToast, showConfirm } = useToast();
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  const [busy, setBusy] = useState(false);
  const dirty = name !== profile.name || description !== profile.description;
  const source = SOURCES[profile.source];

  async function save() {
    setBusy(true);
    const result = await updateOverlayProfile(profile.id, { name, description });
    setBusy(false);
    if (result.success) {
      onChange({ ...profile, name, description });
      showToast("Kohderyhmä tallennettu", "success");
    } else {
      showToast(result.error, "error");
    }
  }

  async function remove() {
    const ok = await showConfirm(
      `Poistetaanko kohderyhmä "${profile.name}"? Laskeutumissivut, joilla se on valittuna, jäävät ilman kohderyhmää.`,
      () => {},
    );
    if (!ok) return;
    setBusy(true);
    const result = await deleteOverlayProfile(profile.id);
    setBusy(false);
    if (result.success) onDelete();
    else showToast(result.error, "error");
  }

  return (
    <li className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Kohderyhmän nimi"
          className="-ml-1.5 min-w-0 flex-1 rounded-md bg-transparent px-1.5 py-1 text-base font-semibold tracking-tight outline-none hover:bg-muted focus:bg-muted focus:ring-2 focus:ring-ring"
        />
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          <source.icon className="size-3" aria-hidden />
          {source.label}
        </span>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          aria-label="Poista kohderyhmä"
          className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="size-4" aria-hidden />
        </button>
      </div>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
        className="mt-2 text-sm"
        placeholder="Keitä he ovat, mikä heitä vaivaa, mitä he arvostavat ja millä sanoilla he puhuvat."
      />
      {dirty && (
        <div className="mt-3 flex justify-end gap-2 overlay-pop">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setName(profile.name);
              setDescription(profile.description);
            }}
          >
            Peru
          </Button>
          <Button size="sm" onClick={save} disabled={busy || !name.trim()}>
            Tallenna
          </Button>
        </div>
      )}
    </li>
  );
}

export default function ProfilesClient({
  initialProfiles,
  crmSegments,
}: {
  initialProfiles: OverlayProfile[];
  crmSegments: CrmSegment[];
}) {
  const { showToast } = useToast();
  const [profiles, setProfiles] = useState(initialProfiles);
  const [busy, setBusy] = useState(false);

  async function add(action: () => Promise<ActionResult>) {
    setBusy(true);
    const result = await action();
    setBusy(false);
    if (result.success) {
      setProfiles((list) => [result.data, ...list]);
      showToast(`${result.data.name} lisätty`, "success");
    } else {
      showToast(result.error, "error");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={() => add(() => createOverlayProfile({ name: "Uusi kohderyhmä", description: "" }))}
        >
          <Plus aria-hidden />
          Uusi kohderyhmä
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => add(importRascalProfile)}>
          <Sparkles aria-hidden />
          Ihanneasiakas Rascal AI:sta
        </Button>
        {crmSegments.length > 0 && (
          <label className="relative inline-flex">
            <span className="sr-only">Tuo CRM-segmentistä</span>
            <UsersRound
              className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <select
              className="h-8 rounded-md border border-input bg-card pl-8 pr-2 text-xs font-medium"
              value=""
              disabled={busy}
              onChange={(e) => {
                const segmentId = e.target.value;
                if (segmentId) add(() => importCrmSegmentProfile(segmentId));
              }}
            >
              <option value="">CRM-segmentistä…</option>
              {crmSegments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.totalContacts})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {profiles.length === 0 ? (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-accent text-primary">
            <UsersRound className="size-6" aria-hidden />
          </span>
          <p className="mt-4 text-sm font-semibold">Ei vielä kohderyhmiä</p>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Aloita tuomalla ihanneasiakas Rascal AI:sta — se on valmiiksi kuvattu
            yrityksen profiilissa.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {profiles.map((p) => (
            <ProfileCard
              key={p.id}
              profile={p}
              onChange={(next) =>
                setProfiles((list) => list.map((x) => (x.id === next.id ? next : x)))
              }
              onDelete={() => setProfiles((list) => list.filter((x) => x.id !== p.id))}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
