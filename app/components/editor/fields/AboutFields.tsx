"use client";

import { TemplateConfig } from "@/src/lib/templates";

interface AboutFieldsProps {
  about?: TemplateConfig["about"];
  onUpdate: (
    field: keyof NonNullable<TemplateConfig["about"]>,
    value: string,
  ) => void;
}

export default function AboutFields({ about, onUpdate }: AboutFieldsProps) {
  return (
    <div className="rounded-lg border border-border p-4">
      <h2 className="mb-4 text-lg font-semibold text-foreground">Tietoja</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground">
            Nimi
          </label>
          <input
            type="text"
            value={about?.name || ""}
            onChange={(e) => onUpdate("name", e.target.value)}
            className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">Bio</label>
          <textarea
            value={about?.bio || ""}
            onChange={(e) => onUpdate("bio", e.target.value)}
            rows={6}
            className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground">
            Profiilikuvan URL (valinnainen)
          </label>
          <input
            type="url"
            value={about?.image || ""}
            onChange={(e) => onUpdate("image", e.target.value)}
            placeholder="https://example.com/image.jpg"
            className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
          />
        </div>
      </div>
    </div>
  );
}
