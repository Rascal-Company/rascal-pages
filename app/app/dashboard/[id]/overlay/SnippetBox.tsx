"use client";

import { useState } from "react";
import { Check, ChevronRight, Code2, Copy } from "lucide-react";

/** Tuotantoasennus: kokoontaitettu, koska editori ja esikatselu toimivat ilman sitä. */
export default function SnippetBox({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <details className="group rounded-xl border border-border bg-card">
      <summary className="flex cursor-pointer list-none items-center gap-3 p-4 [&::-webkit-details-marker]:hidden">
        <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Code2 className="size-4" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">Asenna tuotantoon</span>
          <span className="block text-xs text-muted-foreground">
            Yksi rivi asiakkaan sivulle, kun variaatiot on hyväksytty.
          </span>
        </span>
        <ChevronRight
          className="size-4 text-muted-foreground transition-transform group-open:rotate-90 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="space-y-2 border-t border-border p-4">
        <p className="text-sm text-muted-foreground">
          Lisää rivi asiakkaan sivuston &lt;head&gt;-osioon mahdollisimman ylös. Sama rivi
          toimii kaikille tämän sivuston kampanjoille.
        </p>
        <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
          <code className="min-w-0 flex-1 break-all font-mono text-xs">{snippet}</code>
          <button
            type="button"
            onClick={copy}
            aria-label={copied ? "Kopioitu" : "Kopioi"}
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground"
          >
            {copied ? <Check className="size-4 text-success" /> : <Copy className="size-4" />}
          </button>
        </div>
      </div>
    </details>
  );
}
