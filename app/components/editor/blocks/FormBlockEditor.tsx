"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import type { FormContent, FormField, FormFieldType } from "@/src/lib/templates";

type FormBlockEditorProps = {
  content: FormContent;
  onUpdate: (content: FormContent) => void;
};

const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  email: "Sähköposti",
  text: "Tekstikenttä",
  textarea: "Tekstialue",
  checkbox: "Valintaruutu",
};

export default function FormBlockEditor({
  content,
  onUpdate,
}: FormBlockEditorProps) {
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  const fields = content.fields || [];

  const addField = (type: FormFieldType) => {
    const newField: FormField = {
      id: `field-${nanoid(8)}`,
      type,
      label:
        type === "email"
          ? "Sähköpostiosoite"
          : type === "text"
            ? "Tekstikenttä"
            : type === "textarea"
              ? "Viesti"
              : "Valintaruutu",
      placeholder: type === "checkbox" ? undefined : "",
      required: type === "email",
      name: `field_${Date.now()}`,
    };

    onUpdate({
      ...content,
      fields: [...fields, newField],
    });
  };

  const updateField = (
    fieldId: string,
    updates: Partial<Omit<FormField, "id" | "type">>,
  ) => {
    onUpdate({
      ...content,
      fields: fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)),
    });
  };

  const removeField = (fieldId: string) => {
    onUpdate({
      ...content,
      fields: fields.filter((f) => f.id !== fieldId),
    });
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    const index = fields.findIndex((f) => f.id === fieldId);
    if (index === -1) return;
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === fields.length - 1) return;

    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [
      newFields[targetIndex],
      newFields[index],
    ];

    onUpdate({
      ...content,
      fields: newFields,
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 Tiedot tallennetaan aina Rascal Pages -järjestelmään. Voit lisäksi
          määrittää oman webhook URL:n, johon tiedot lähetetään.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            Lomakkeen kentät
          </label>
        </div>

        {fields.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Ei kenttiä. Lisää kenttä alta.
          </p>
        )}

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div
              key={field.id}
              className="border border-gray-200 rounded-lg p-4 bg-white"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedFieldId(
                        expandedFieldId === field.id ? null : field.id,
                      )
                    }
                    className="text-sm font-medium text-gray-700 hover:text-gray-900"
                  >
                    {expandedFieldId === field.id ? "▼" : "▶"}{" "}
                    {field.label || "Nimetön kenttä"}
                  </button>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {FIELD_TYPE_LABELS[field.type]}
                  </span>
                  {field.required && (
                    <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                      Pakollinen
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveField(field.id, "up")}
                    disabled={index === 0}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Siirrä ylös"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveField(field.id, "down")}
                    disabled={index === fields.length - 1}
                    className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Siirrä alas"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => removeField(field.id)}
                    className="p-1 text-red-600 hover:text-red-800"
                    title="Poista kenttä"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {expandedFieldId === field.id && (
                <div className="space-y-3 mt-3 pt-3 border-t border-gray-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Kentän otsikko
                    </label>
                    <input
                      type="text"
                      value={field.label}
                      onChange={(e) =>
                        updateField(field.id, { label: e.target.value })
                      }
                      placeholder="Esim. Sähköpostiosoite"
                      className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
                    />
                  </div>

                  {field.type !== "checkbox" && (
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Placeholder-teksti
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ""}
                        onChange={(e) =>
                          updateField(field.id, { placeholder: e.target.value })
                        }
                        placeholder="Esim. nimi@esimerkki.fi"
                        className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Kentän nimi (tekninen)
                    </label>
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) =>
                        updateField(field.id, { name: e.target.value })
                      }
                      placeholder="esim. email, name, phone"
                      className="w-full text-sm rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`required-${field.id}`}
                      checked={field.required}
                      onChange={(e) =>
                        updateField(field.id, { required: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                    />
                    <label
                      htmlFor={`required-${field.id}`}
                      className="text-sm text-gray-700"
                    >
                      Pakollinen kenttä
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => addField("email")}
            className="text-sm px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            + Sähköposti
          </button>
          <button
            type="button"
            onClick={() => addField("text")}
            className="text-sm px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            + Tekstikenttä
          </button>
          <button
            type="button"
            onClick={() => addField("textarea")}
            className="text-sm px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            + Tekstialue
          </button>
          <button
            type="button"
            onClick={() => addField("checkbox")}
            className="text-sm px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            + Valintaruutu
          </button>
        </div>
      </div>

      {/* Form title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lomakkeen otsikko (valinnainen)
        </label>
        <input
          type="text"
          value={content.formTitle || ""}
          onChange={(e) =>
            onUpdate({ ...content, formTitle: e.target.value })
          }
          placeholder="Lataa ilmaiseksi"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>

      {/* Submit button text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lähetysnapin teksti
        </label>
        <input
          type="text"
          value={content.submitButtonText || ""}
          onChange={(e) =>
            onUpdate({ ...content, submitButtonText: e.target.value })
          }
          placeholder="Lähetä"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
      </div>

      {/* Webhook URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Webhook URL (valinnainen)
        </label>
        <input
          type="url"
          value={content.webhookUrl || ""}
          onChange={(e) =>
            onUpdate({ ...content, webhookUrl: e.target.value })
          }
          placeholder="https://your-webhook.com/endpoint"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          Lomakkeen tiedot lähetetään tähän URL:iin JSON-muodossa.
        </p>
      </div>

      {/* Success message */}
      <div className="pt-4 border-t border-gray-200">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Onnistumisviesti
        </h3>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Otsikko
            </label>
            <input
              type="text"
              value={content.successMessage?.title || ""}
              onChange={(e) =>
                onUpdate({
                  ...content,
                  successMessage: {
                    ...content.successMessage,
                    title: e.target.value,
                    description: content.successMessage?.description || "",
                  },
                })
              }
              placeholder="Kiitos! Tietosi on tallennettu."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kuvaus
            </label>
            <textarea
              value={content.successMessage?.description || ""}
              onChange={(e) =>
                onUpdate({
                  ...content,
                  successMessage: {
                    title: content.successMessage?.title || "",
                    description: e.target.value,
                  },
                })
              }
              placeholder="Saat pian lisätietoja sähköpostiisi."
              rows={2}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-brand-accent focus:outline-none focus:ring-brand-accent sm:text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
