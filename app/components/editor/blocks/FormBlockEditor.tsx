"use client";

import type { FormContent } from "@/src/lib/templates";

type FormBlockEditorProps = {
  content: FormContent;
  onUpdate: (content: FormContent) => void;
};

export default function FormBlockEditor({
  content,
  onUpdate,
}: FormBlockEditorProps) {
  const handleFieldUpdate = (field: "title" | "description", value: string) => {
    onUpdate({
      ...content,
      successMessage: {
        ...content?.successMessage,
        [field]: value,
      },
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Lomake näytetään automaattisesti. Muokkaa alla onnistumisviestiä.
      </p>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Onnistumisviestin otsikko
        </label>
        <input
          type="text"
          value={content?.successMessage?.title || ""}
          onChange={(e) => handleFieldUpdate("title", e.target.value)}
          placeholder="Kiitos! Tietosi on tallennettu."
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Onnistumisviestin kuvaus
        </label>
        <textarea
          value={content?.successMessage?.description || ""}
          onChange={(e) => handleFieldUpdate("description", e.target.value)}
          placeholder="Saat pian lisätietoja sähköpostiisi."
          rows={2}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>
    </div>
  );
}
