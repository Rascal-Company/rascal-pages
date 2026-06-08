import type { FormContent, FormField, ThemeConfig } from "@/lib/templates";

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
];

/**
 * Lead form. Ported from the app as a static, dependency-free version: it posts
 * natively to `content.webhookUrl` (no client JS, no server action, no
 * Supabase). Central lead handling can be wired in via the webhook later.
 */
export default function FormBlock({
  content,
  theme,
}: {
  content: FormContent;
  theme: ThemeConfig;
}) {
  const primaryColor = theme.primaryColor || "#3B82F6";
  const fields = content.fields?.length ? content.fields : DEFAULT_FIELDS;
  const submitButtonText = content.submitButtonText || "Lähetä";

  return (
    <section className="py-16">
      <div className="mx-auto max-w-md px-6 lg:px-8">
        <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-900/10">
          {content.formTitle && (
            <h2 className="mb-6 text-2xl font-bold text-gray-900">
              {content.formTitle}
            </h2>
          )}

          <form
            action={content.webhookUrl || undefined}
            method="post"
            className="space-y-4"
          >
            {fields.map((field) => {
              if (field.type === "checkbox") {
                return (
                  <div key={field.id} className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id={field.id}
                      name={field.name}
                      required={field.required}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
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
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      {field.label}
                      {field.required && <span className="ml-1 text-red-500">*</span>}
                    </label>
                    <textarea
                      id={field.id}
                      name={field.name}
                      required={field.required}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                );
              }

              return (
                <div key={field.id}>
                  <label
                    htmlFor={field.id}
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </label>
                  <input
                    type={field.type}
                    id={field.id}
                    name={field.name}
                    required={field.required}
                    placeholder={field.placeholder}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              );
            })}
            <button
              type="submit"
              className="w-full rounded-md px-6 py-3 text-base font-semibold text-white shadow-md transition-colors hover:opacity-90"
              style={{ backgroundColor: primaryColor }}
            >
              {submitButtonText}
            </button>
            <p className="mt-2 text-center text-xs text-gray-500">
              Emme koskaan jaa tietojasi kolmansien osapuolten kanssa.
            </p>
          </form>
        </div>
      </div>
    </section>
  );
}
