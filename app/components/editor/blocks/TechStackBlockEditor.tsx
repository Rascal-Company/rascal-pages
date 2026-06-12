"use client";

import type { TechStackContent, TechStackGroup } from "@/src/lib/templates";
import { parseTagList, formatTagList } from "@/src/lib/templates";

type TechStackBlockEditorProps = {
  content: TechStackContent;
  onUpdate: (content: TechStackContent) => void;
};

const inputClass =
  "block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm";

export default function TechStackBlockEditor({
  content,
  onUpdate,
}: TechStackBlockEditorProps) {
  const groups = content.groups || [];

  const updateField = <K extends keyof TechStackContent>(
    field: K,
    value: TechStackContent[K],
  ) => {
    onUpdate({ ...content, [field]: value });
  };

  const updateGroup = (index: number, patch: Partial<TechStackGroup>) => {
    updateField(
      "groups",
      groups.map((group, i) => (i === index ? { ...group, ...patch } : group)),
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
        <label className="block text-sm font-medium text-gray-700 mb-1">
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
        <span className="text-sm font-medium text-gray-700">Ryhmät</span>
        <button
          onClick={() =>
            updateField("groups", [
              ...groups,
              { group: "Uusi ryhmä", items: [] },
            ])
          }
          className="rounded-md bg-brand-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-accent-hover"
        >
          + Lisää
        </button>
      </div>

      <div className="space-y-4">
        {groups.map((group, index) => (
          <div
            key={index}
            className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                Ryhmä {index + 1}
              </span>
              <button
                onClick={() =>
                  updateField(
                    "groups",
                    groups.filter((_, i) => i !== index),
                  )
                }
                className="text-sm text-red-600 hover:text-red-700"
              >
                Poista
              </button>
            </div>
            <input
              type="text"
              value={group.group}
              onChange={(e) => updateGroup(index, { group: e.target.value })}
              placeholder="Ryhmän nimi (esim. Frontend)"
              className={inputClass}
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Teknologiat (pilkulla eroteltuna)
              </label>
              <input
                type="text"
                value={formatTagList(group.items)}
                onChange={(e) =>
                  updateGroup(index, { items: parseTagList(e.target.value) })
                }
                placeholder="React, TypeScript, Tailwind"
                className={inputClass}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
