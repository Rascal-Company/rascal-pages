"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/app/components/ui/dialog";
import { startPublishFlow } from "@/app/actions/billing";

type Interval = "month" | "year";

const PLANS: { interval: Interval; price: string; note: string }[] = [
  { interval: "month", price: "19 €/kk", note: "Laskutetaan kuukausittain" },
  { interval: "year", price: "190 €/v", note: "2 kuukautta kaupan päälle" },
];

/**
 * Julkaisun maksu (RAS-1170): avautuu kun julkaisu palauttaa PAYMENT_REQUIRED.
 * Rascal-paketin vapaa sivustopaikka aktivoituu ilman maksua.
 */
export default function PublishPlanDialog({
  siteId,
  open,
  onOpenChange,
  onActivated,
}: {
  siteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Sivustolle aktivoitui Rascal-paketin paikka: julkaise uudelleen. */
  onActivated: () => void;
}) {
  const [pending, setPending] = useState<Interval | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = async (interval: Interval) => {
    setPending(interval);
    setError(null);
    const result = await startPublishFlow(siteId, interval);
    if (result.status === "checkout") {
      window.location.assign(result.url);
      return;
    }
    setPending(null);
    if (result.status === "activated") {
      onOpenChange(false);
      onActivated();
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Julkaise sivusto</DialogTitle>
          <DialogDescription>
            Sivuston julkaisu maksaa 19 €/kk (alv 0). Sisältää oman domainin ja enintään viisi julkaistua sivua.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          {PLANS.map((plan) => (
            <Button
              key={plan.interval}
              variant={plan.interval === "year" ? "default" : "outline"}
              className="h-auto flex-col items-start gap-0.5 py-3 text-left"
              disabled={pending !== null}
              onClick={() => choose(plan.interval)}
            >
              <span className="text-base font-semibold">{pending === plan.interval ? "Avataan…" : plan.price}</span>
              <span className="text-xs font-normal opacity-80">{plan.note}</span>
            </Button>
          ))}
        </div>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Landerit ja personointi sisältyvät Rascal-pakettiin.{" "}
          <a href="https://www.rascal.fi" target="_blank" rel="noreferrer" className="underline underline-offset-2">
            Varaa demo
          </a>
        </p>
      </DialogContent>
    </Dialog>
  );
}
