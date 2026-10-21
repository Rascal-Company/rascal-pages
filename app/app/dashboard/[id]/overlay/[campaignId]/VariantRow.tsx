"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Sparkles } from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import { setOverlayVariantActive } from "@/app/actions/overlay";
import type { OverlayVariantId } from "@/src/lib/overlay";
import StatsRow from "../StatsRow";
import type { VariantStats } from "../overlay-data";

export default function VariantRow({
  variantId,
  name,
  active: initialActive,
  personalized,
  aiPrompt,
  editorHref,
  stats,
}: {
  variantId: OverlayVariantId;
  name: string;
  active: boolean;
  personalized: number;
  aiPrompt: boolean;
  editorHref: string;
  stats: VariantStats;
}) {
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle(next: boolean) {
    setActive(next);
    setBusy(true);
    setError(null);
    const result = await setOverlayVariantActive(variantId, next);
    setBusy(false);
    if (!result.success) {
      setActive(!next);
      setError(result.error);
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-md border border-brand-dark/10 p-3 sm:flex-row sm:items-center">
      <Switch checked={active} onCheckedChange={toggle} disabled={busy} aria-label="Julkaistu" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-brand-dark">{name}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              active ? "bg-green-100 text-green-800" : "bg-brand-dark/10 text-brand-dark/70"
            }`}
          >
            {active ? "Julkaistu" : "Luonnos"}
          </span>
          {aiPrompt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-light px-2 py-0.5 text-xs text-brand-dark/80">
              <Sparkles className="size-3" aria-hidden />
              AI-ohje
            </span>
          )}
        </div>
        <p className="text-xs text-brand-dark/60">{personalized} elementtiä personoitu</p>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
      <StatsRow stats={stats} compact />
      <Link
        href={editorHref}
        className="self-start text-brand-dark/60 hover:text-brand-dark sm:self-auto"
        aria-label={`Muokkaa ${name}`}
      >
        <Pencil className="size-4" aria-hidden />
      </Link>
    </li>
  );
}
