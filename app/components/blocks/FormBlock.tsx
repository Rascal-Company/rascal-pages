"use client";

import { useState, useTransition } from "react";
import type { FormContent, HeroContent, FormField } from "@/src/lib/templates";
import { submitLead } from "@/app/actions/submit-lead";
import type { SiteId } from "@/src/lib/types";

type FormBlockProps = {
  content: FormContent;
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
  hero?: HeroContent;
};

const DEFAULT_FIELDS: FormField[] = [
  {
    id: "field-email-1",
    type: "email",
    label: "Sähköpostiosoite",
    placeholder: "nimi@esimerkki.fi",
    required: true,
    name: "email",
  },
  {
    id: "field-name-1",
    type: "text",
    label: "Nimi",
    placeholder: "Etunimesi",
    required: false,
    name: "name",
  },
  {
    id: "field-consent-1",
    type: "checkbox",
    label: "Haluan vastaanottaa markkinointiviestejä ja uutisia sähköpostiini.",
    required: false,
    name: "marketingConsent",
  },
];

export default function FormBlock({
  content,
  theme,
  siteId,
  isPreview = false,
  hero,
}: FormBlockProps) {
  const primaryColor = theme.primaryColor || "#3B82F6";
  const [isPending, startTransition] = useTransition();
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const fields = content.fields || DEFAULT_FIELDS;
  const submitButtonText =
    content.submitButtonText || hero?.ctaText || "Lähetä";

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isPreview) {
      setFormStatus("success");
      setTimeout(() => setFormStatus("idle"), 2000);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const formFields: Record<string, string | boolean> = {};

    fields.forEach((field) => {
      const value = formData.get(field.name);
      if (field.type === "checkbox") {
        formFields[field.name] = value === "on";
      } else {
        formFields[field.name] = (value as string) || "";
      }
    });

    startTransition(async () => {
      const result = await submitLead(
        siteId,
        formFields,
        content.webhookUrl || null,
      );
      if (result.success) {
        setFormStatus("success");
        setErrorMessage("");
        (e.target as HTMLFormElement).reset();
        if (hero?.ctaLink) {
          window.open(hero.ctaLink, "_blank", "noopener,noreferrer");
        }
      } else {
        setFormStatus("error");
        setErrorMessage(result.error || "Jokin meni pieleen. Yritä uudelleen.");
      }
    });
  };

  return (
    <section className="py-16">
      <div className="mx-auto max-w-md px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/10">
          {content.formTitle && (
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {content.formTitle}
            </h2>
          )}

          {formStatus === "success" && (
            <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800 border border-green-200">
              <p className="font-semibold">
                {content.successMessage?.title ||
                  "Kiitos! Tietosi on tallennettu."}
              </p>
              <p className="text-sm mt-1">
                {content.successMessage?.description ||
                  "Saat pian lisätietoja sähköpostiisi."}
              </p>
            </div>
          )}

          {formStatus === "error" && (
            <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 border border-red-200">
              <p className="font-semibold">Virhe</p>
              <p className="text-sm mt-1">{errorMessage}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((field) => {
              if (field.type === "checkbox") {
                return (
                  <div key={field.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={field.id}
                      name={field.name}
                      required={field.required}
                      disabled={isPending}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                    />
                    <label htmlFor={field.id} className="text-sm text-gray-600">
                      {field.label}
                    </label>
                  </div>
                );
              }

              if (field.type === "textarea") {
                return (
                  <div key={field.id}>
                    <label
                      htmlFor={field.id}
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </label>
                    <textarea
                      id={field.id}
                      name={field.name}
                      required={field.required}
                      disabled={isPending}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>
                );
              }

              return (
                <div key={field.id}>
                  <label
                    htmlFor={field.id}
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    {field.label}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </label>
                  <input
                    type={field.type}
                    id={field.id}
                    name={field.name}
                    required={field.required}
                    disabled={isPending}
                    placeholder={field.placeholder}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              );
            })}
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-md px-6 py-3 text-base font-semibold text-white shadow-md transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {isPending ? "Lähetetään..." : submitButtonText}
            </button>
            <p className="text-xs text-center text-gray-500 mt-2">
              Emme koskaan jaa tietojasi kolmansien osapuolten kanssa.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
