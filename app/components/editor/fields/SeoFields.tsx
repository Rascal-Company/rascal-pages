"use client";

import type { SeoConfig } from "@/src/lib/templates";
import ImageUploadField from "./ImageUploadField";

type SeoFieldsProps = {
  metaTitle?: string;
  metaDescription?: string;
  ogImage?: string;
  onUpdate: (field: keyof SeoConfig, value: string) => void;
};

const TITLE_RECOMMENDED_MAX = 60;
const DESCRIPTION_RECOMMENDED_MAX = 160;

export default function SeoFields({
  metaTitle,
  metaDescription,
  ogImage,
  onUpdate,
}: SeoFieldsProps) {
  const titleLength = (metaTitle ?? "").length;
  const descriptionLength = (metaDescription ?? "").length;

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <h2 className="mb-1 text-lg font-semibold text-gray-900">Hakukoneet (SEO)</h2>
      <p className="mb-4 text-sm text-gray-500">
        Säädä miltä sivu näyttää Googlessa ja jaettuna someen. Jätä tyhjäksi,
        niin tiedot otetaan automaattisesti sivun sisällöstä.
      </p>

      <div className="mb-4">
        <label
          htmlFor="seo-title"
          className="block text-sm font-medium text-gray-700"
        >
          Meta-otsikko
        </label>
        <input
          id="seo-title"
          type="text"
          value={metaTitle ?? ""}
          onChange={(e) => onUpdate("metaTitle", e.target.value)}
          placeholder="Esim. Sami Kiias — Markkinoinnin asiantuntija"
          className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
        <p
          className={`mt-1 text-xs ${
            titleLength > TITLE_RECOMMENDED_MAX
              ? "text-amber-600"
              : "text-gray-500"
          }`}
        >
          {titleLength}/{TITLE_RECOMMENDED_MAX} merkkiä suositus
        </p>
      </div>

      <div className="mb-4">
        <label
          htmlFor="seo-description"
          className="block text-sm font-medium text-gray-700"
        >
          Meta-kuvaus
        </label>
        <textarea
          id="seo-description"
          value={metaDescription ?? ""}
          onChange={(e) => onUpdate("metaDescription", e.target.value)}
          rows={3}
          placeholder="Lyhyt kuvaus, joka näkyy hakutuloksissa otsikon alla."
          className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
        <p
          className={`mt-1 text-xs ${
            descriptionLength > DESCRIPTION_RECOMMENDED_MAX
              ? "text-amber-600"
              : "text-gray-500"
          }`}
        >
          {descriptionLength}/{DESCRIPTION_RECOMMENDED_MAX} merkkiä suositus
        </p>
      </div>

      <div>
        <label
          htmlFor="seo-og-image"
          className="block text-sm font-medium text-gray-700"
        >
          Jakokuva (Open Graph)
        </label>
        <div className="mt-2">
          <ImageUploadField
            value={ogImage}
            onChange={(url) => onUpdate("ogImage", url)}
            placeholder="https://..."
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Kuva, joka näytetään kun linkki jaetaan somessa (suositus 1200×630).
        </p>
      </div>
    </div>
  );
}
