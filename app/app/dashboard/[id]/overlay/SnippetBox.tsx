"use client";

import { useState } from "react";

export default function SnippetBox({ snippet }: { snippet: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="rounded-lg border border-brand-dark/10 bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-brand-dark">Asennus</h2>
      <p className="mt-1 text-sm text-brand-dark/60">
        Lisää tämä rivi asiakkaan sivuston &lt;head&gt;-osioon mahdollisimman ylös.
        Sama snippet toimii kaikille tämän sivuston varianteille.
      </p>
      <div className="mt-4 flex items-start gap-2 rounded-md border border-brand-dark/10 bg-brand-light p-3">
        <code className="min-w-0 flex-1 break-all font-mono text-xs text-brand-dark/80">
          {snippet}
        </code>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 text-sm font-medium text-primary hover:text-primary-hover"
        >
          {copied ? "Kopioitu" : "Kopioi"}
        </button>
      </div>
    </section>
  );
}
