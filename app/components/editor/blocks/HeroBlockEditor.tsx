"use client";

import { useState } from "react";
import { nanoid } from "nanoid";
import type { HeroContent, FormField, FormFieldType } from "@/src/lib/templates";
import SortableFieldList from "../fields/SortableFieldList";
import ImageUploadField from "../fields/ImageUploadField";

type HeroBlockEditorProps = {
  content: HeroContent;
  onUpdate: (content: HeroContent) => void;
};

const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  email: "Sähköposti",
  text: "Tekstikenttä",
  textarea: "Tekstialue",
  checkbox: "Valintaruutu",
};

const HERO_FIELDS = [
  { key: "title", label: "Otsikko" },
  { key: "subtitle", label: "Alaotsikko" },
  { key: "cta", label: "CTA / Lomake" },
  { key: "image", label: "Kuva" },
];

const DEFAULT_HERO_ORDER = ["title", "subtitle", "cta", "image"];

export default function HeroBlockEditor({
  content,
  onUpdate,
}: HeroBlockEditorProps) {
  const [expandedFieldId, setExpandedFieldId] = useState<string | null>(null);

  const handleFieldUpdate = (field: keyof HeroContent, value: string) => {
    onUpdate({ ...content, [field]: value });
  };

  const handleToggleForm = (checked: boolean) => {
    onUpdate({
      ...content,
      showForm: checked,
      formFields: checked
        ? content.formFields ?? [
            {
              id: "field-email-1",
              type: "email" as const,
              label: "Sähköpostiosoite",
              placeholder: "nimi@esimerkki.fi",
              required: true,
              name: "email",
            },
            {
              id: "field-name-1",
              type: "text" as const,
              label: "Nimi",
              placeholder: "Etunimesi",
              required: false,
              name: "name",
            },
            {
              id: "field-consent-1",
              type: "checkbox" as const,
              label: "Haluan vastaanottaa markkinointiviestejä ja uutisia sähköpostiini.",
              required: false,
              name: "marketingConsent",
            },
          ]
        : undefined,
      formSuccessMessage: checked
        ? content.formSuccessMessage ?? {
            title: "Kiitos!",
            description: "Tietosi on tallennettu.",
          }
        : undefined,
    });
  };

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
      formFields: [...(content.formFields || []), newField],
    });
  };

  const updateField = (
    fieldId: string,
    updates: Partial<Omit<FormField, "id" | "type">>,
  ) => {
    onUpdate({
      ...content,
      formFields: (content.formFields || []).map((f) =>
        f.id === fieldId ? { ...f, ...updates } : f,
      ),
    });
  };

  const removeField = (fieldId: string) => {
    onUpdate({
      ...content,
      formFields: (content.formFields || []).filter((f) => f.id !== fieldId),
    });
  };

  const moveField = (fieldId: string, direction: "up" | "down") => {
    const fields = content.formFields || [];
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
      formFields: newFields,
    });
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

  const formFields = content.formFields || [];

  const handleFieldOrderChange = (newOrder: string[]) => {
    onUpdate({ ...content, fieldOrder: newOrder });
  };

  const renderHeroField = (fieldKey: string) => {
    switch (fieldKey) {
      case "title":
        return (
          <input
            type="text"
            value={content?.title || ""}
            onChange={(e) => handleFieldUpdate("title", e.target.value)}
            className="block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
          />
        );
      case "subtitle":
        return (
          <textarea
            value={content?.subtitle || ""}
            onChange={(e) => handleFieldUpdate("subtitle", e.target.value)}
            rows={3}
            className="block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
          />
        );
      case "cta":
        return (
          <div className="space-y-4">
            {/* Form Toggle Section */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">
                  Näytä lomake pääosiossa
                </label>
                <button
                  type="button"
                  role="switch"
                  aria-checked={content?.showForm ?? false}
                  onClick={() => handleToggleForm(!content?.showForm)}
                  className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                    content?.showForm ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-card shadow ring-0 transition duration-200 ease-in-out ${
                      content?.showForm ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Kerää sähköposteja suoraan pääosiossa
              </p>
            </div>

            {content?.showForm && (
              <div className="space-y-6 rounded-lg bg-muted p-4">
                <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
                  <p className="text-sm text-primary">
                    Tiedot tallennetaan aina Rascal Pages -järjestelmään. Voit
                    lisäksi määrittää oman webhook URL:n.
                  </p>
                </div>

                {/* Fields */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-foreground">
                      Lomakkeen kentät
                    </label>
                  </div>

                  {formFields.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">
                      Ei kenttiä. Lisää kenttä alta.
                    </p>
                  )}

                  <div className="space-y-2">
                    {formFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="border border-border rounded-lg p-3 bg-card"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedFieldId(
                                  expandedFieldId === field.id
                                    ? null
                                    : field.id,
                                )
                              }
                              className="text-sm font-medium text-foreground hover:text-foreground"
                            >
                              {expandedFieldId === field.id ? "▼" : "▶"}{" "}
                              {field.label || "Nimetön kenttä"}
                            </button>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              {FIELD_TYPE_LABELS[field.type]}
                            </span>
                            {field.required && (
                              <span className="text-xs text-destructive bg-destructive/10 px-2 py-1 rounded">
                                Pakollinen
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => moveField(field.id, "up")}
                              disabled={index === 0}
                              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Siirrä ylös"
                            >
                              ↑
                            </button>
                            <button
                              type="button"
                              onClick={() => moveField(field.id, "down")}
                              disabled={index === formFields.length - 1}
                              className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Siirrä alas"
                            >
                              ↓
                            </button>
                            <button
                              type="button"
                              onClick={() => removeField(field.id)}
                              className="p-1 text-destructive hover:text-destructive"
                              title="Poista kenttä"
                            >
                              ✕
                            </button>
                          </div>
                        </div>

                        {expandedFieldId === field.id && (
                          <div className="space-y-3 mt-3 pt-3 border-t border-border">
                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Kentän otsikko
                              </label>
                              <input
                                type="text"
                                value={field.label}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    label: e.target.value,
                                  })
                                }
                                placeholder="Esim. Sähköpostiosoite"
                                className="w-full text-sm rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                              />
                            </div>

                            {field.type !== "checkbox" && (
                              <div>
                                <label className="block text-xs font-medium text-muted-foreground mb-1">
                                  Placeholder-teksti
                                </label>
                                <input
                                  type="text"
                                  value={field.placeholder || ""}
                                  onChange={(e) =>
                                    updateField(field.id, {
                                      placeholder: e.target.value,
                                    })
                                  }
                                  placeholder="Esim. nimi@esimerkki.fi"
                                  className="w-full text-sm rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                                />
                              </div>
                            )}

                            <div>
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Kentän nimi (tekninen)
                              </label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    name: e.target.value,
                                  })
                                }
                                placeholder="esim. email, name, phone"
                                className="w-full text-sm rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`required-${field.id}`}
                                checked={field.required}
                                onChange={(e) =>
                                  updateField(field.id, {
                                    required: e.target.checked,
                                  })
                                }
                                className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                              />
                              <label
                                htmlFor={`required-${field.id}`}
                                className="text-sm text-foreground"
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
                      className="text-sm px-3 py-2 bg-muted text-foreground rounded hover:bg-accent"
                    >
                      + Sähköposti
                    </button>
                    <button
                      type="button"
                      onClick={() => addField("text")}
                      className="text-sm px-3 py-2 bg-muted text-foreground rounded hover:bg-accent"
                    >
                      + Tekstikenttä
                    </button>
                    <button
                      type="button"
                      onClick={() => addField("textarea")}
                      className="text-sm px-3 py-2 bg-muted text-foreground rounded hover:bg-accent"
                    >
                      + Tekstialue
                    </button>
                    <button
                      type="button"
                      onClick={() => addField("checkbox")}
                      className="text-sm px-3 py-2 bg-muted text-foreground rounded hover:bg-accent"
                    >
                      + Valintaruutu
                    </button>
                  </div>
                </div>

                {/* Submit button text */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Lähetysnapin teksti
                  </label>
                  <input
                    type="text"
                    value={content.formSubmitButtonText || ""}
                    onChange={(e) =>
                      onUpdate({
                        ...content,
                        formSubmitButtonText: e.target.value,
                      })
                    }
                    placeholder={content.ctaText || "Lähetä"}
                    className="w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
                  />
                </div>

                {/* Webhook URL */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Webhook URL (valinnainen)
                  </label>
                  <input
                    type="url"
                    value={content.formWebhookUrl || ""}
                    onChange={(e) =>
                      onUpdate({ ...content, formWebhookUrl: e.target.value })
                    }
                    placeholder="https://your-webhook.com/endpoint"
                    className="w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Lomakkeen tiedot lähetetään tähän URL:iin JSON-muodossa.
                  </p>
                </div>

                {/* Success message */}
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-medium text-foreground mb-3">
                    Onnistumisviesti
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Otsikko
                      </label>
                      <input
                        type="text"
                        value={content?.formSuccessMessage?.title || ""}
                        onChange={(e) =>
                          handleSuccessMessageUpdate("title", e.target.value)
                        }
                        placeholder="Kiitos!"
                        className="w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Kuvaus
                      </label>
                      <input
                        type="text"
                        value={content?.formSuccessMessage?.description || ""}
                        onChange={(e) =>
                          handleSuccessMessageUpdate(
                            "description",
                            e.target.value,
                          )
                        }
                        placeholder="Tietosi on tallennettu."
                        className="w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground">
                    Lähetyksen jälkeinen linkki (valinnainen)
                  </label>
                  <input
                    type="text"
                    value={content?.ctaLink || ""}
                    onChange={(e) =>
                      handleFieldUpdate("ctaLink", e.target.value)
                    }
                    placeholder="https://example.com/kiitos"
                    className="mt-1 block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Avautuu uuteen välilehteen lomakkeen lähetyksen jälkeen
                  </p>
                </div>
              </div>
            )}

            {!content?.showForm && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    CTA-teksti
                  </label>
                  <input
                    type="text"
                    value={content?.ctaText || ""}
                    onChange={(e) =>
                      handleFieldUpdate("ctaText", e.target.value)
                    }
                    className="block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    CTA-linkki
                  </label>
                  <input
                    type="text"
                    value={content?.ctaLink || ""}
                    onChange={(e) =>
                      handleFieldUpdate("ctaLink", e.target.value)
                    }
                    className="block w-full rounded-md border border-input px-3 py-2 text-foreground focus:border-ring focus:outline-none focus:ring-ring sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        );
      case "image":
        return (
          <ImageUploadField
            value={content?.image}
            onChange={(url) => handleFieldUpdate("image", url)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Asettelu
        </label>
        <div className="grid grid-cols-2 gap-1">
          {(
            [
              { value: "centered", label: "Keskitetty" },
              { value: "left", label: "Vasen" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onUpdate({ ...content, layout: option.value })}
              className={`rounded-md border px-2 py-1.5 text-xs font-medium transition-colors ${
                (content?.layout ?? "centered") === option.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-foreground hover:bg-accent"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <SortableFieldList
        fields={HERO_FIELDS}
        fieldOrder={content?.fieldOrder || DEFAULT_HERO_ORDER}
        onReorder={handleFieldOrderChange}
        renderField={renderHeroField}
      />
    </div>
  );
}
