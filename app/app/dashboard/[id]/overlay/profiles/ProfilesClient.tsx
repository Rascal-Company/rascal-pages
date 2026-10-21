"use client";

import { useState } from "react";
import { Plus, Sparkles, UsersRound } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import {
  createOverlayProfile,
  deleteOverlayProfile,
  importCrmSegmentProfile,
  importRascalProfile,
  updateOverlayProfile,
  type OverlayProfile,
} from "@/app/actions/overlay";

type CrmSegment = { id: string; name: string; totalContacts: number };

const SOURCE_LABELS: Record<OverlayProfile["source"], string> = {
  custom: "Oma",
  rascal_ai: "Rascal AI",
  crm_segment: "CRM-segmentti",
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
  const [name, setName] = useState(profile.name);
  const [description, setDescription] = useState(profile.description);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = name !== profile.name || description !== profile.description;

  async function save() {
    setBusy(true);
    setMessage(null);
    const result = await updateOverlayProfile(profile.id, { name, description });
    setBusy(false);
    if (result.success) {
      onChange({ ...profile, name, description });
      setMessage("Tallennettu.");
    } else {
      setMessage(result.error);
    }
  }

  async function remove() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setBusy(true);
    const result = await deleteOverlayProfile(profile.id);
    setBusy(false);
    if (result.success) onDelete();
    else setMessage(result.error);
  }

  return (
    <li className="space-y-2 rounded-lg border border-brand-dark/10 bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} className="h-8 font-medium" />
        <span className="shrink-0 rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand-dark/70">
          {SOURCE_LABELS[profile.source]}
        </span>
      </div>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={5}
        placeholder="Keitä he ovat, mikä heitä vaivaa, mitä he arvostavat, millä kielellä heille puhutaan."
      />
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={busy || !dirty || !name.trim()}>
          Tallenna
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={remove}
          disabled={busy}
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          {confirmDelete ? "Vahvista poisto" : "Poista"}
        </Button>
        {message && <span className="text-sm text-brand-dark/70">{message}</span>}
      </div>
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
  const [profiles, setProfiles] = useState(initialProfiles);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(
    action: () => Promise<{ success: true; data: OverlayProfile } | { success: false; error: string }>,
  ) {
    setBusy(true);
    setError(null);
    const result = await action();
    setBusy(false);
    if (result.success) setProfiles((list) => [result.data, ...list]);
    else setError(result.error);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          disabled={busy}
          onClick={() => add(() => createOverlayProfile({ name: "Uusi profiili", description: "" }))}
        >
          <Plus aria-hidden />
          Uusi profiili
        </Button>
        <Button size="sm" variant="outline" disabled={busy} onClick={() => add(importRascalProfile)}>
          <Sparkles aria-hidden />
          Tuo ihanneasiakas Rascal AI:sta
        </Button>
        {crmSegments.length > 0 && (
          <label className="flex min-w-0 items-center gap-1 text-sm text-brand-dark/70">
            <UsersRound className="size-4 shrink-0" aria-hidden />
            <select
              className="h-8 min-w-0 rounded-md border border-input bg-card px-2 text-sm"
              value=""
              disabled={busy}
              onChange={(e) => {
                const segmentId = e.target.value;
                if (segmentId) add(() => importCrmSegmentProfile(segmentId));
              }}
            >
              <option value="">Tuo CRM-segmentistä…</option>
              {crmSegments.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.totalContacts})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}

      {profiles.length === 0 ? (
        <p className="text-sm text-brand-dark/60">Ei vielä profiileja.</p>
      ) : (
        <ul className="space-y-4">
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
