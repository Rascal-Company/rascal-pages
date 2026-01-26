"use client";

import type { HeroContent } from "@/src/lib/templates";

type HeroBlockEditorProps = {
  content: HeroContent;
  onUpdate: (content: HeroContent) => void;
};

export default function HeroBlockEditor({
  content,
  onUpdate,
}: HeroBlockEditorProps) {
  const handleFieldUpdate = (field: keyof HeroContent, value: string) => {
    onUpdate({ ...content, [field]: value });
  };

  const handleToggleForm = (checked: boolean) => {
    onUpdate({
      ...content,
      showForm: checked,
      collectName: checked ? content.collectName ?? true : undefined,
      formSuccessMessage: checked
        ? content.formSuccessMessage ?? {
            title: "Kiitos!",
            description: "Tietosi on tallennettu.",
          }
        : undefined,
    });
  };

  const handleToggleCollectName = (checked: boolean) => {
    onUpdate({ ...content, collectName: checked });
  };

  const handleSuccessMessageUpdate = (
    field: "title" | "description",
    value: string,
  ) => {
    onUpdate({
      ...content,
      formSuccessMessage: {
        title: content.formSuccessMessage?.title ?? "Kiitos!",
        description:
          content.formSuccessMessage?.description ?? "Tietosi on tallennettu.",
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Otsikko
        </label>
        <input
          type="text"
          value={content?.title || ""}
          onChange={(e) => handleFieldUpdate("title", e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Alaotsikko
        </label>
        <textarea
          value={content?.subtitle || ""}
          onChange={(e) => handleFieldUpdate("subtitle", e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>

      {/* Form Toggle Section */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Näytä lomake herossa
          </label>
          <button
            type="button"
            role="switch"
            aria-checked={content?.showForm ?? false}
            onClick={() => handleToggleForm(!content?.showForm)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              content?.showForm ? "bg-blue-600" : "bg-gray-200"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                content?.showForm ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Kerää sähköposteja suoraan hero-osiossa
        </p>
      </div>

      {content?.showForm && (
        <div className="space-y-4 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              Kerää myös nimi
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={content?.collectName ?? false}
              onClick={() => handleToggleCollectName(!content?.collectName)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                content?.collectName ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  content?.collectName ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Onnistumisviesti - Otsikko
            </label>
            <input
              type="text"
              value={content?.formSuccessMessage?.title || ""}
              onChange={(e) =>
                handleSuccessMessageUpdate("title", e.target.value)
              }
              placeholder="Kiitos!"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Onnistumisviesti - Kuvaus
            </label>
            <input
              type="text"
              value={content?.formSuccessMessage?.description || ""}
              onChange={(e) =>
                handleSuccessMessageUpdate("description", e.target.value)
              }
              placeholder="Tietosi on tallennettu."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
            />
          </div>
        </div>
      )}

      {!content?.showForm && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              CTA-teksti
            </label>
            <input
              type="text"
              value={content?.ctaText || ""}
              onChange={(e) => handleFieldUpdate("ctaText", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              CTA-linkki
            </label>
            <input
              type="text"
              value={content?.ctaLink || ""}
              onChange={(e) => handleFieldUpdate("ctaLink", e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
            />
          </div>
        </>
      )}

      {content?.showForm && (
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Lähetyksen jälkeinen linkki (valinnainen)
          </label>
          <input
            type="text"
            value={content?.ctaLink || ""}
            onChange={(e) => handleFieldUpdate("ctaLink", e.target.value)}
            placeholder="https://example.com/kiitos"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            Avautuu uuteen välilehteen lomakkeen lähetyksen jälkeen
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Hero-kuvan URL (valinnainen)
        </label>
        <input
          type="url"
          value={content?.image || ""}
          onChange={(e) => handleFieldUpdate("image", e.target.value)}
          placeholder="https://example.com/kuva.jpg"
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
        {content?.image && (
          <img
            src={content.image}
            alt="Hero preview"
            className="mt-2 h-24 w-auto rounded-md object-cover"
          />
        )}
      </div>
    </div>
  );
}
