"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { RASCAL_PRODUCTS } from "@rascal/auth";
import { Button } from "@/app/components/ui/button";

/**
 * Julkaisun jälkeen (RAS-1172): kehotus kertoa sivusta somessa Rascal AI:lla.
 * Rascal AI ei vielä ota esitäytettyä postausta vastaan, joten osoite
 * kopioidaan leikepöydälle ja Rascal AI avataan uuteen välilehteen.
 */
export default function PublishedShareCard({ siteUrl, onClose }: { siteUrl: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const shareWithRascal = async () => {
    try {
      await navigator.clipboard.writeText(siteUrl);
      setCopied(true);
    } catch {
      // Leikepöytä estetty: Rascal AI aukeaa silti.
    }
    window.open(RASCAL_PRODUCTS["rascal-ai"].url, "_blank", "noopener");
  };

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-50 w-[min(22rem,calc(100vw-2rem))] rounded-xl border border-border bg-card p-4 shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-foreground">Sivu on julkaistu 🎉</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Sulje"
          className="-m-1 rounded p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        Kerro siitä somessa: Rascal AI kirjoittaa postauksen ja julkaisee sen kanaviisi.
      </p>
      <Button size="sm" className="mt-3" onClick={shareWithRascal}>
        {copied ? "Osoite kopioitu, Rascal AI aukeaa" : "Tee somepostaus Rascal AI:lla"}
      </Button>
    </div>
  );
}
