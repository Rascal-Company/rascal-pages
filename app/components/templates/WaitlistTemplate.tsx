"use client";

import { TemplateConfig } from "@/src/lib/templates";
import { submitLead } from "@/app/actions/submit-lead";
import { useState, useTransition } from "react";
import type { SiteId } from "@/src/lib/types";

interface WaitlistTemplateProps {
  content: TemplateConfig;
  siteId: SiteId;
  isPreview?: boolean;
}

export default function WaitlistTemplate({
  content,
  siteId,
  isPreview = false,
}: WaitlistTemplateProps) {
  const primaryColor = content?.theme?.primaryColor || "#8B5CF6";
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

    const fields: Record<string, string | boolean> = {
      email,
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

  return (
    <div
      className="min-h-screen"
      style={{
        background: content?.hero?.image
          ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${content.hero.image})`
          : "linear-gradient(135deg, #f3e8ff 0%, #ffffff 50%, #f3e8ff 100%)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Background Pattern (only shown when no image) */}
      {!content?.hero?.image && (
        <div
          className="absolute inset-0 opacity-5 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, ${primaryColor} 1px, transparent 1px)`,
            backgroundSize: "50px 50px",
          }}
        />
      )}

      {/* Hero Section - Centered */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          <h1
            className={`text-5xl font-bold tracking-tight sm:text-6xl ${content?.hero?.image ? "text-white" : "text-gray-900"}`}
          >
            {content?.hero?.title || "Otsikko"}
          </h1>
          <p
            className={`mt-6 text-xl leading-8 ${content?.hero?.image ? "text-white/90" : "text-gray-600"}`}
          >
            {content?.hero?.subtitle || "Alaotsikko"}
          </p>

          {/* Waitlist Form */}
          <div className="mt-10">
            {formStatus === "success" && (
              <div className="mb-6 rounded-lg bg-green-50 p-4 text-green-800 border border-green-200 max-w-md mx-auto">
                <p className="font-semibold">
                  {content.successMessage?.title ||
                    "Kiitos! Olet nyt odotuslistalla."}
                </p>
                <p className="text-sm mt-1">
                  {content.successMessage?.description ||
                    "Saat pian lisätietoja sähköpostiisi."}
                </p>
              </div>
            )}

            {formStatus === "error" && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800 border border-red-200 max-w-md mx-auto">
                <p className="font-semibold">Virhe</p>
                <p className="text-sm mt-1">{errorMessage}</p>
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto"
            >
              <input
                type="email"
                name="email"
                required
                disabled={isPending}
                placeholder="Sähköpostiosoitteesi"
                className="flex-1 rounded-lg border border-gray-300 px-6 py-4 text-lg text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                style={{ backgroundColor: primaryColor }}
              >
                {isPending
                  ? "Lähetetään..."
                  : content?.hero?.ctaText || "Liity odotuslistalle"}
              </button>
            </form>
            <p className="mt-4 text-sm text-gray-500">
              Liity odotuslistalle ja saat eksklusiivisen pääsyn heti kun
              julkaisemme.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>Ei roskapostia</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>Tietoturva</span>
            </div>
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Pian saatavilla</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-white border-t border-gray-200">
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
