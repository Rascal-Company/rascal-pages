"use client";

import { TemplateConfig } from "@/src/lib/templates";

interface HeroFieldsProps {
  hero: TemplateConfig["hero"];
  onUpdate: (field: string, value: string) => void;
}

export default function HeroFields({ hero, onUpdate }: HeroFieldsProps) {
  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Pääosio</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Otsikko
          </label>
          <input
            type="text"
            value={hero?.title || ""}
            onChange={(e) => onUpdate("title", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Alaotsikko
          </label>
          <textarea
            value={hero?.subtitle || ""}
            onChange={(e) => onUpdate("subtitle", e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            CTA-teksti
          </label>
          <input
            type="text"
            value={hero?.ctaText || ""}
            onChange={(e) => onUpdate("ctaText", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            CTA-linkki
          </label>
          <input
            type="text"
            value={hero?.ctaLink || ""}
            onChange={(e) => onUpdate("ctaLink", e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Pääosion kuva (valinnainen)
          </label>
          <input
            type="url"
            value={hero?.image || ""}
            onChange={(e) => onUpdate("image", e.target.value)}
            placeholder="https://example.com/kuva.jpg"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
          />
          {hero?.image && (
            <img
              src={hero.image}
              alt="Kuvan esikatselu"
              className="mt-2 h-24 w-auto rounded-md object-cover"
            />
          )}
        </div>
      </div>
    </div>
  );
}
