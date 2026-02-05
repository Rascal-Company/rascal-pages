"use client";

import { TemplateConfig } from "@/src/lib/templates";
import { submitLead } from "@/app/actions/submit-lead";
import { AnalyticsLink } from "@/app/components/AnalyticsLink";
import { useState, useTransition } from "react";
import type { SiteId } from "@/src/lib/types";

interface LeadMagnetTemplateProps {
  content: TemplateConfig;
  siteId: SiteId;
  isPreview?: boolean;
}

export default function LeadMagnetTemplate({
  content,
  siteId,
  isPreview = false,
}: LeadMagnetTemplateProps) {
  const primaryColor = content?.theme?.primaryColor || "#3B82F6";
  const [isPending, startTransition] = useTransition();
  const [formStatus, setFormStatus] = useState<"idle" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string>("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Don't submit in preview mode
    if (isPreview) {
      setFormStatus("success");
      setTimeout(() => setFormStatus("idle"), 2000);
      return;
    }

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const name = formData.get("name") as string;

    const fields: Record<string, string | boolean> = {
      email,
      name,
    };

    startTransition(async () => {
      const result = await submitLead(siteId, fields, null);
      if (result.success) {
        setFormStatus("success");
        setErrorMessage("");
        (e.target as HTMLFormElement).reset();
      } else {
        setFormStatus("error");
        setErrorMessage(result.error || "Jokin meni pieleen. Yritä uudelleen.");
      }
    });
  };

  const heroContent = content.hero;
  if (!heroContent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Split Layout */}
      <section
        className="relative overflow-hidden"
        style={{
          background: heroContent.image
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${heroContent.image})`
            : `linear-gradient(135deg, ${primaryColor}15 0%, ${primaryColor}05 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-12 lg:max-w-none lg:grid-cols-2 lg:items-center">
            {/* Left Side - Content */}
            <div>
              <h1
                className={`text-4xl font-bold tracking-tight sm:text-5xl ${heroContent.image ? "text-white" : "text-gray-900"}`}
              >
                {heroContent.title}
              </h1>
              <p
                className={`mt-6 text-lg leading-8 ${heroContent.image ? "text-white/90" : "text-gray-600"}`}
              >
                {heroContent.subtitle}
              </p>

              {/* Benefits List */}
              {content.features && content.features.length > 0 && (
                <ul className="mt-8 space-y-4">
                  {content.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      {feature.image ? (
                        <img
                          src={feature.image}
                          alt={feature.title}
                          className="h-8 w-8 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <span className="text-2xl">{feature.icon}</span>
                      )}
                      <div>
                        <h3
                          className={`font-semibold ${heroContent.image ? "text-white" : "text-gray-900"}`}
                        >
                          {feature.title}
                        </h3>
                        <p
                          className={`mt-1 text-sm ${heroContent.image ? "text-white/80" : "text-gray-600"}`}
                        >
                          {feature.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              {/* CTA Button */}
              <div className="mt-10">
                <AnalyticsLink
                  siteId={siteId}
                  href={heroContent.ctaLink}
                  className="inline-block rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                  style={{ backgroundColor: primaryColor }}
                  eventMetadata={{ location: "hero_left" }}
                >
                  {heroContent.ctaText}
                </AnalyticsLink>
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="lg:pl-8">
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
                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full rounded-md px-6 py-3 text-base font-semibold text-white shadow-md transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {isPending ? "Lähetetään..." : heroContent.ctaText}
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Emme koskaan jaa tietojasi kolmansien osapuolten kanssa.
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <p className="text-sm leading-5 text-gray-500">
              &copy; {new Date().getFullYear()} Rascal Pages. Kaikki oikeudet
              pidätetään.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
