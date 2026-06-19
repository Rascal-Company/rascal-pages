"use client";

import type { PricingContent, PricingTier } from "@/src/lib/templates";
import { parseTagList, formatTagList } from "@/src/lib/templates";

type PricingBlockEditorProps = {
  content: PricingContent;
  onUpdate: (content: PricingContent) => void;
};

const inputClass =
  "block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm";

const emptyTier: PricingTier = {
  name: "Uusi paketti",
  price: "0 €",
  period: "/kk",
  description: "",
  features: [],
  ctaText: "Valitse",
  ctaLink: "#",
};

export default function PricingBlockEditor({
  content,
  onUpdate,
}: PricingBlockEditorProps) {
  const tiers = content.tiers || [];

  const updateField = <K extends keyof PricingContent>(
    field: K,
    value: PricingContent[K],
  ) => {
    onUpdate({ ...content, [field]: value });
  };

  const updateTier = (index: number, patch: Partial<PricingTier>) => {
    updateField(
      "tiers",
      tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Otsikko
        </label>
        <input
          type="text"
          value={content.heading || ""}
          onChange={(e) => updateField("heading", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Alaotsikko
        </label>
        <input
          type="text"
          value={content.subheading || ""}
          onChange={(e) => updateField("subheading", e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-foreground">
          Sarakkeet
        </label>
        <div className="grid grid-cols-2 gap-1">
          {([2, 3] as const).map((cols) => (
            <button
              key={cols}
              type="button"
              onClick={() => updateField("columns", cols)}
              className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                (content.columns ?? 3) === cols
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:bg-accent"
              }`}
            >
              {cols}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Paketit</span>
        <button
          onClick={() => updateField("tiers", [...tiers, { ...emptyTier }])}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Lisää
        </button>
      </div>

      <div className="space-y-4">
        {tiers.map((tier, index) => (
          <div
            key={index}
            className="space-y-3 rounded-md border border-border bg-muted p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Paketti {index + 1}
              </span>
              <button
                onClick={() =>
                  updateField(
                    "tiers",
                    tiers.filter((_, i) => i !== index),
                  )
                }
                className="text-sm text-destructive hover:text-destructive"
              >
                Poista
              </button>
            </div>

            <input
              type="text"
              value={tier.name}
              onChange={(e) => updateTier(index, { name: e.target.value })}
              placeholder="Paketin nimi"
              className={inputClass}
            />
            <div className="flex gap-2">
              <input
                type="text"
                value={tier.price}
                onChange={(e) => updateTier(index, { price: e.target.value })}
                placeholder="29 €"
                className={inputClass}
              />
              <input
                type="text"
                value={tier.period || ""}
                onChange={(e) => updateTier(index, { period: e.target.value })}
                placeholder="/kk"
                className={`${inputClass} w-24`}
              />
            </div>
            <input
              type="text"
              value={tier.description || ""}
              onChange={(e) =>
                updateTier(index, { description: e.target.value })
              }
              placeholder="Lyhyt kuvaus"
              className={inputClass}
            />

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">
                Ominaisuudet (pilkulla eroteltuna)
              </label>
              <input
                type="text"
                value={formatTagList(tier.features)}
                onChange={(e) =>
                  updateTier(index, { features: parseTagList(e.target.value) })
                }
                placeholder="esim. 5 käyttäjää, Prioriteettituki"
                className={inputClass}
              />
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={tier.ctaText || ""}
                onChange={(e) => updateTier(index, { ctaText: e.target.value })}
                placeholder="Napin teksti"
                className={`${inputClass} w-1/3`}
              />
              <input
                type="text"
                value={tier.ctaLink || ""}
                onChange={(e) => updateTier(index, { ctaLink: e.target.value })}
                placeholder="#tai https://..."
                className={inputClass}
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                checked={tier.highlighted ?? false}
                onChange={(e) =>
                  updateTier(index, { highlighted: e.target.checked })
                }
                className="rounded border-input"
              />
              Korosta suosituimpana
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
