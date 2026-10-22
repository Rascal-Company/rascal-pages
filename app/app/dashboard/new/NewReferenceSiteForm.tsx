"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Loader2, Plus, X } from "lucide-react";
import { createReferenceSite } from "@/app/actions/reference-site";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import SegmentedControl from "@/app/components/ui/segmented-control";
import type { ReferenceMode } from "@/src/lib/reference-page";
import { cn } from "@/src/lib/utils";

const MAX_URLS = 3;

/** Vaiheet näytetään odotuksen aikana; palvelin ei raportoi edistymistä, joten ajat ovat arvioita. */
const STEPS = [
  { label: "Haetaan referenssisivut", after: 0 },
  { label: "Luetaan rakenne, värit ja fontit", after: 4_000 },
  { label: "Suunnitellaan sivu ja kirjoitetaan sisältö", after: 9_000 },
  { label: "Rakennetaan osiot", after: 40_000 },
];

const MODE_HELP: Record<ReferenceMode, string> = {
  inspiration:
    "Muiden sivuja: otetaan rakenne, rytmi, värit ja typografia. Tekstit kirjoitetaan yrityksesi tiedoista, eikä referensseistä kopioida tekstejä, kuvia eikä logoja.",
  own: "Oma nykyinen sivusi: ilme säilyy ja sivun tekstejä ja kuvia saa käyttää uuden sivun pohjana.",
};

function ProgressSteps({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(startedAt);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(timer);
  }, []);
  const elapsed = now - startedAt;
  const current = STEPS.findLastIndex((step) => elapsed >= step.after);

  return (
    <ol className="space-y-3" aria-live="polite">
      {STEPS.map((step, i) => (
        <li
          key={step.label}
          className={cn(
            "flex items-center gap-3 text-sm transition-colors",
            i < current && "text-muted-foreground",
            i === current && "font-medium text-foreground",
            i > current && "text-muted-foreground/50",
          )}
        >
          <span className="flex size-5 items-center justify-center">
            {i < current ? (
              <Check className="size-4 text-primary" aria-hidden />
            ) : i === current ? (
              <Loader2 className="size-4 animate-spin text-primary motion-reduce:animate-none" aria-hidden />
            ) : (
              <span className="size-1.5 rounded-full bg-current" aria-hidden />
            )}
          </span>
          {step.label}
        </li>
      ))}
      <li className="pt-1 text-xs text-muted-foreground">Kestää yleensä alle minuutin.</li>
    </ol>
  );
}

export default function NewReferenceSiteForm() {
  const router = useRouter();
  const [urls, setUrls] = useState<string[]>([""]);
  const [mode, setMode] = useState<ReferenceMode>("inspiration");
  const [goal, setGoal] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const filledUrls = urls.filter((u) => u.trim());
  const canSubmit = filledUrls.length > 0 && /^[a-zA-Z0-9]+$/.test(subdomain) && startedAt === null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setStartedAt(Date.now());
    const result = await createReferenceSite({ subdomain, urls: filledUrls, mode, goal });
    if (result.success) {
      router.push(`/app/dashboard/${result.siteId}`);
      return;
    }
    setError(result.error);
    setStartedAt(null);
  }

  const updateUrl = (index: number, value: string) => setUrls((prev) => prev.map((u, i) => (i === index ? value : u)));
  const busy = startedAt !== null;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/app/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
            ← Takaisin dashboardiin
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-foreground">Sivu referenssien pohjalta</h1>
          <p className="mt-2 text-muted-foreground">
            Anna 1–3 sivua, joiden ilmeestä pidät. AI lukee niiden rakenteen ja tyylin ja tekee sivun yrityksesi
            Rascal AI -profiilin pohjalta. Kaikkea voi muokata editorissa.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6 shadow-sm sm:p-8">
          {busy ? (
            <ProgressSteps startedAt={startedAt} />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div role="alert" className="rounded-md bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Referenssisivut</legend>
                {urls.map((url, i) => (
                  <div key={i} className="flex gap-2">
                    <Input
                      type="text"
                      inputMode="url"
                      aria-label={`Referenssisivu ${i + 1}`}
                      value={url}
                      onChange={(e) => updateUrl(i, e.target.value)}
                      placeholder={i === 0 ? "https://esimerkki.fi" : "Toinen sivu (valinnainen)"}
                      required={i === 0}
                    />
                    {urls.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Poista sivu"
                        onClick={() => setUrls((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <X aria-hidden />
                      </Button>
                    )}
                  </div>
                ))}
                {urls.length < MAX_URLS && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => setUrls((prev) => [...prev, ""])}>
                    <Plus aria-hidden />
                    Lisää sivu
                  </Button>
                )}
              </fieldset>

              <div className="space-y-2">
                <Label>Mitä sivuja nämä ovat?</Label>
                <SegmentedControl
                  ariaLabel="Referenssien tyyppi"
                  value={mode}
                  onChange={setMode}
                  options={[
                    { value: "inspiration", label: "Inspiraatio" },
                    { value: "own", label: "Oma sivuni" },
                  ]}
                />
                <p className="text-xs text-muted-foreground">{MODE_HELP[mode]}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Mitä sivulla tavoitellaan?</Label>
                <Textarea
                  id="goal"
                  rows={3}
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="Esim. Myymme kirjanpitopalvelua pienyrittäjille. Kävijän pitäisi varata maksuton kartoitus."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain</Label>
                <div className="flex rounded-md shadow-sm">
                  <Input
                    id="subdomain"
                    required
                    pattern="[a-zA-Z0-9]+"
                    value={subdomain}
                    onChange={(e) => setSubdomain(e.target.value)}
                    className="rounded-r-none"
                    placeholder="esimerkki"
                  />
                  <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                    .rascalpages.fi
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={!canSubmit} className="flex-1">
                  Tee sivu
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/app/dashboard">Peruuta</Link>
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
