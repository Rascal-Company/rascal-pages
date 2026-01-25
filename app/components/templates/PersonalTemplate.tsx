"use client";

import { TemplateConfig } from "@/src/lib/templates";
import { AnalyticsLink } from "@/app/components/AnalyticsLink";

interface PersonalTemplateProps {
  content: TemplateConfig;
  siteId: string;
}

export default function PersonalTemplate({
  content,
  siteId,
}: PersonalTemplateProps) {
  const primaryColor = content.theme?.primaryColor || "#10B981";

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Profile */}
      <section
        className="relative overflow-hidden bg-gradient-to-br from-green-50 to-white"
        style={{
          background: content.hero.image
            ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${content.hero.image})`
            : `linear-gradient(135deg, ${primaryColor}15 0%, transparent 100%)`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Profile Picture */}
            {content.about?.image ? (
              <img
                src={content.about.image}
                alt={content.about.name}
                className="mx-auto h-32 w-32 rounded-full object-cover ring-4 ring-white shadow-xl"
              />
            ) : (
              <div className="mx-auto h-32 w-32 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white text-4xl font-bold ring-4 ring-white shadow-xl">
                {content.about?.name?.charAt(0).toUpperCase() || "A"}
              </div>
            )}

            <h1
              className={`mt-8 text-4xl font-bold tracking-tight sm:text-5xl ${content.hero.image ? "text-white" : "text-gray-900"}`}
            >
              {content.hero.title}
            </h1>
            <p
              className={`mt-6 text-lg leading-8 ${content.hero.image ? "text-white/90" : "text-gray-600"}`}
            >
              {content.hero.subtitle}
            </p>
            {content.hero.ctaText && (
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <AnalyticsLink
                  siteId={siteId}
                  href={content.hero.ctaLink}
                  className="rounded-md px-6 py-3 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                  style={{ backgroundColor: primaryColor }}
                  eventMetadata={{ location: "hero_cta" }}
                >
                  {content.hero.ctaText}
                </AnalyticsLink>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Story Section */}
      {content.about && (
        <section className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-8">
                Tarina
              </h2>
              <div className="prose prose-lg prose-gray max-w-none">
                <p className="text-lg leading-8 text-gray-600 whitespace-pre-line">
                  {content.about.bio}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {content.testimonials && content.testimonials.length > 0 && (
        <section className="bg-gray-50 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Suosittelut
              </h2>
              <p className="mt-2 text-lg leading-8 text-gray-600">
                Mitä asiakkaat sanovat
              </p>
            </div>
            <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-8 lg:mx-0 lg:max-w-none lg:grid-cols-3">
              {content.testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="flex flex-col rounded-2xl bg-white p-8 shadow-sm"
                >
                  <div className="flex items-center gap-x-1 text-yellow-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        className="h-5 w-5 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 leading-relaxed mb-6">
                    "{testimonial.text}"
                  </p>
                  <div className="mt-auto flex items-center gap-3">
                    {testimonial.avatar ? (
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {testimonial.name?.charAt(0).toUpperCase() || "A"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {testimonial.name}
                      </p>
                      {testimonial.company && (
                        <p className="text-sm text-gray-500">
                          {testimonial.company}
                        </p>
                      )}
                    </div>
                  </div>
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
