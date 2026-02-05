"use client";

import { TemplateConfig } from "@/src/lib/templates";
import { AnalyticsLink } from "@/app/components/AnalyticsLink";
import type { SiteId } from "@/src/lib/types";

interface SaasModernTemplateProps {
  content: TemplateConfig;
  siteId: SiteId;
}

export default function SaasModernTemplate({
  content,
  siteId,
}: SaasModernTemplateProps) {
  const primaryColor = content.theme?.primaryColor || "#3B82F6";
  const heroContent = content.hero;
  if (!heroContent) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background: heroContent.image
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${heroContent.image})`
            : `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              {heroContent.title}
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/90">
              {heroContent.subtitle}
            </p>
            {heroContent.ctaText && (
              <div className="mt-10 flex items-center gap-x-6 justify-center">
                <AnalyticsLink
                  siteId={siteId}
                  href={heroContent.ctaLink}
                  className="rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
                  eventMetadata={{ location: "hero_cta" }}
                >
                  {heroContent.ctaText}
                </AnalyticsLink>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Logos Section (Placeholder) */}
      <section className="py-12 bg-gray-50 border-y border-gray-200">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-center text-sm font-semibold text-gray-500 uppercase tracking-wide mb-8">
            Luottavat meihin
          </p>
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-6">
            {/* Placeholder logos */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="flex items-center justify-center h-12 text-gray-400 text-sm font-semibold"
              >
                Logo {i}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      {content.features && content.features.length > 0 && (
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Ominaisuudet
              </h2>
              <p className="mt-2 text-lg leading-8 text-gray-600">
                Tutustu tarjoamiimme ratkaisuihin
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {content.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex flex-col items-start rounded-2xl bg-gray-50 p-8 shadow-sm hover:shadow-md transition-shadow"
                >
                  {feature.image ? (
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="h-16 w-16 rounded-xl object-cover mb-4"
                    />
                  ) : feature.icon ? (
                    <div className="text-5xl mb-4">{feature.icon}</div>
                  ) : null}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {content.faq && content.faq.length > 0 && (
        <section className="py-24 sm:py-32 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Usein kysytyt kysymykset
              </h2>
              <p className="mt-2 text-lg leading-8 text-gray-600">
                Löydä vastauksia yleisimpiin kysymyksiin
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl space-y-8">
              {content.faq.map((item, index) => (
                <div key={index} className="rounded-2xl bg-white p-8 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {item.question}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{item.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <div className="text-center">
            <p className="text-sm leading-5 text-gray-400">
              &copy; {new Date().getFullYear()} Rascal Pages. Kaikki oikeudet
              pidätetään.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
