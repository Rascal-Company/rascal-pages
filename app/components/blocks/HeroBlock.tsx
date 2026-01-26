"use client";

import { useState, useTransition } from "react";
import type { HeroContent } from "@/src/lib/templates";
import { AnalyticsLink } from "@/app/components/AnalyticsLink";
import { submitLead } from "@/app/actions/submit-lead";
import type { SiteId } from "@/src/lib/types";

type HeroBlockProps = {
  content: HeroContent;
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function HeroBlock({
  content,
  theme,
  siteId,
  isPreview = false,
}: HeroBlockProps) {
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
        if (content.ctaLink) {
          window.open(content.ctaLink, "_blank", "noopener,noreferrer");
        }
      } else {
        setFormStatus("error");
        setErrorMessage(result.error || "Jokin meni pieleen. Yritä uudelleen.");
      }
    });
  };

  const hasForm = content.showForm;
  const hasImage = content.image && !hasForm;

  return (
    <section
      className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white"
      style={{
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
      }}
    >
      <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
        <div
          className={`mx-auto ${hasImage || hasForm ? "grid lg:grid-cols-2 gap-12 items-center" : "max-w-2xl text-center"}`}
        >
          <div>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              {content.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/90">
              {content.subtitle}
            </p>
            {!hasForm && content.ctaText && (
              <div
                className={`mt-10 flex items-center gap-x-6 ${hasImage ? "" : "justify-center"}`}
              >
                <AnalyticsLink
                  siteId={siteId}
                  href={content.ctaLink}
                  className="rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
                  eventMetadata={{ location: "hero_cta" }}
                >
                  {content.ctaText}
                </AnalyticsLink>
              </div>
            )}
          </div>

          {hasForm && (
            <div className="rounded-2xl bg-white p-8 shadow-2xl">
              {formStatus === "success" && (
                <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800 border border-green-200">
                  <p className="font-semibold">
                    {content.formSuccessMessage?.title || "Kiitos!"}
                  </p>
                  <p className="text-sm mt-1">
                    {content.formSuccessMessage?.description ||
                      "Tietosi on tallennettu."}
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
                    htmlFor="hero-email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Sähköpostiosoite
                  </label>
                  <input
                    type="email"
                    id="hero-email"
                    name="email"
                    required
                    disabled={isPending}
                    className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="nimi@esimerkki.fi"
                  />
                </div>
                {content.collectName && (
                  <div>
                    <label
                      htmlFor="hero-name"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Nimi
                    </label>
                    <input
                      type="text"
                      id="hero-name"
                      name="name"
                      disabled={isPending}
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Etunimesi"
                    />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="hero-marketingConsent"
                    name="marketingConsent"
                    disabled={isPending}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                  />
                  <label
                    htmlFor="hero-marketingConsent"
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
                  {isPending ? "Lähetetään..." : content.ctaText || "Lähetä"}
                </button>
                <p className="text-xs text-center text-gray-500 mt-2">
                  Emme koskaan jaa tietojasi kolmansien osapuolten kanssa.
                </p>
              </form>
            </div>
          )}

          {hasImage && (
            <div className="relative">
              <img
                src={content.image}
                alt={content.title}
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
