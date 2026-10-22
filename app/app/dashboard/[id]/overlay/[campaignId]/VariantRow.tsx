"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { Switch } from "@/app/components/ui/switch";
import { useToast } from "@/app/components/ui/ToastContainer";
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
  const { showToast } = useToast();
  const [active, setActive] = useState(initialActive);
  const [busy, setBusy] = useState(false);

  // Kytkin kääntyy heti; palautetaan, jos tallennus epäonnistuu.
  async function toggle(next: boolean) {
    setActive(next);
    setBusy(true);
    const result = await setOverlayVariantActive(variantId, next);
    setBusy(false);
    if (!result.success) {
      setActive(!next);
      showToast(result.error, "error");
    } else {
      showToast(next ? `${name} julkaistu` : `${name} piilotettu`, "success");
    }
  }

  return (
    <li className="group flex flex-col gap-3 px-5 py-3.5 sm:flex-row sm:items-center">
      <Switch
        checked={active}
        onCheckedChange={toggle}
        disabled={busy}
        aria-label={`${name}: ${active ? "julkaistu" : "luonnos"}`}
      />
      <Link href={editorHref} className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{name}</span>
          {aiPrompt && (
            <Sparkles className="size-3.5 shrink-0 text-primary" aria-label="AI-ohje" />
          )}
        </span>
        <span className="block text-xs text-muted-foreground">
          {active ? "Julkaistu" : "Luonnos"} · {personalized} elementtiä personoitu
        </span>
      </Link>
      <StatsRow stats={stats} compact />
      <Link
        href={editorHref}
        aria-label={`Muokkaa ${name}`}
        className="hidden text-muted-foreground transition-transform group-hover:translate-x-0.5 hover:text-foreground motion-reduce:transition-none sm:block"
      >
        <ChevronRight className="size-4" aria-hidden />
      </Link>
    </li>
  );
}
