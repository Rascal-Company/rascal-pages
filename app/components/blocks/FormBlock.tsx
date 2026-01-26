"use client";

import { useState, useTransition } from "react";
import type { FormContent, HeroContent } from "@/src/lib/templates";
import { submitLead } from "@/app/actions/submit-lead";
import type { SiteId } from "@/src/lib/types";

type FormBlockProps = {
  content: FormContent;
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
  hero?: HeroContent;
};

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

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isPreview) {
      setFormStatus("success");
      setTimeout(() => setFormStatus("idle"), 2000);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;
    const marketingConsent = formData.get("marketingConsent") === "on";

    startTransition(async () => {
      const result = await submitLead(siteId, email, name, marketingConsent);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Lataa ilmaiseksi
          </h2>

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
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Sähköpostiosoite
              </label>
              <input
                type="email"
                id="email"
                name="email"
                required
                disabled={isPending}
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="nimi@esimerkki.fi"
              />
            </div>
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Nimi
              </label>
              <input
                type="text"
                id="name"
                name="name"
                disabled={isPending}
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Etunimesi"
              />
            </div>
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="marketingConsent"
                name="marketingConsent"
                disabled={isPending}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <label
                htmlFor="marketingConsent"
                className="text-sm text-gray-600"
              >
                Haluan vastaanottaa markkinointiviestejä ja uutisia
                sähköpostiini.
              </label>
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-md px-6 py-3 text-base font-semibold text-white shadow-md transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: primaryColor }}
            >
              {isPending ? "Lähetetään..." : hero?.ctaText || "Lähetä"}
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
