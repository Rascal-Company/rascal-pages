"use client";

import type { CasesContent, CaseItem, CaseOutcome } from "@/src/lib/templates";
import { parseTagList, formatTagList } from "@/src/lib/templates";
import ImageUploadField from "../fields/ImageUploadField";

type CasesBlockEditorProps = {
  content: CasesContent;
  onUpdate: (content: CasesContent) => void;
};

const inputClass =
  "block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm";

const emptyItem: CaseItem = {
  title: "Uusi projekti",
  tagline: "",
  summary: "",
  tags: [],
  outcomes: [],
  linkLabel: "",
  linkUrl: "",
};

export default function CasesBlockEditor({
  content,
  onUpdate,
}: CasesBlockEditorProps) {
  const items = content.items || [];

  const updateField = <K extends keyof CasesContent>(
    field: K,
    value: CasesContent[K],
  ) => {
    onUpdate({ ...content, [field]: value });
  };

  const updateItem = (index: number, patch: Partial<CaseItem>) => {
    updateField(
      "items",
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const updateOutcomes = (index: number, outcomes: CaseOutcome[]) => {
    updateItem(index, { outcomes });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
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
        <label className="block text-sm font-medium text-foreground mb-1">
          Alaotsikko
        </label>
        <input
          type="text"
          value={content.subheading || ""}
          onChange={(e) => updateField("subheading", e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">Projektit</span>
        <button
          onClick={() => updateField("items", [...items, { ...emptyItem }])}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Lisää
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="rounded-md border border-border bg-muted p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Projekti {index + 1}
              </span>
              <button
                onClick={() =>
                  updateField(
                    "items",
                    items.filter((_, i) => i !== index),
                  )
                }
                className="text-sm text-destructive hover:text-destructive"
              >
                Poista
              </button>
            </div>

            <input
              type="text"
              value={item.title}
              onChange={(e) => updateItem(index, { title: e.target.value })}
              placeholder="Projektin nimi"
              className={inputClass}
            />
            <input
              type="text"
              value={item.tagline}
              onChange={(e) => updateItem(index, { tagline: e.target.value })}
              placeholder="Lyhyt iskulause"
              className={inputClass}
            />
            <textarea
              value={item.summary}
              onChange={(e) => updateItem(index, { summary: e.target.value })}
              placeholder="Kuvaus projektista"
              rows={3}
              className={inputClass}
            />
            <ImageUploadField
              value={item.image}
              onChange={(url) => updateItem(index, { image: url })}
            />
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Avainsanat (pilkulla eroteltuna)
              </label>
              <input
                type="text"
                value={formatTagList(item.tags)}
                onChange={(e) =>
                  updateItem(index, { tags: parseTagList(e.target.value) })
                }
                placeholder="esim. Suunnittelu, Valokuvaus, Strategia"
                className={inputClass}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-muted-foreground">
                  Tulokset
                </label>
                <button
                  onClick={() =>
                    updateOutcomes(index, [
                      ...item.outcomes,
                      { value: "", label: "" },
                    ])
                  }
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Lisää tulos
                </button>
              </div>
              <div className="space-y-2">
                {item.outcomes.map((outcome, outcomeIndex) => (
                  <div key={outcomeIndex} className="flex gap-2">
                    <input
                      type="text"
                      value={outcome.value}
                      onChange={(e) =>
                        updateOutcomes(
                          index,
                          item.outcomes.map((o, i) =>
                            i === outcomeIndex
                              ? { ...o, value: e.target.value }
                              : o,
                          ),
                        )
                      }
                      placeholder="50+"
                      className={`${inputClass} w-24`}
                    />
                    <input
                      type="text"
                      value={outcome.label}
                      onChange={(e) =>
                        updateOutcomes(
                          index,
                          item.outcomes.map((o, i) =>
                            i === outcomeIndex
                              ? { ...o, label: e.target.value }
                              : o,
                          ),
                        )
                      }
                      placeholder="Aktiivista käyttäjää"
                      className={inputClass}
                    />
                    <button
                      onClick={() =>
                        updateOutcomes(
                          index,
                          item.outcomes.filter((_, i) => i !== outcomeIndex),
                        )
                      }
                      className="px-2 text-sm text-destructive hover:text-destructive"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={item.linkLabel || ""}
                onChange={(e) =>
                  updateItem(index, { linkLabel: e.target.value })
                }
                placeholder="Linkin teksti"
                className={`${inputClass} w-1/3`}
              />
              <input
                type="url"
                value={item.linkUrl || ""}
                onChange={(e) => updateItem(index, { linkUrl: e.target.value })}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
