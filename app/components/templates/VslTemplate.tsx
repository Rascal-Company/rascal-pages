"use client";

import { TemplateConfig } from "@/src/lib/templates";
import { AnalyticsLink } from "@/app/components/AnalyticsLink";
import type { SiteId } from "@/src/lib/types";

interface VslTemplateProps {
  content: TemplateConfig;
  siteId: SiteId;
}

export default function VslTemplate({ content, siteId }: VslTemplateProps) {
  const primaryColor = content.theme?.primaryColor || "#EF4444";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-24 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              {content.hero.title}
            </h1>
            {content.hero.subtitle && (
              <p className="mt-6 text-lg leading-8 text-gray-300">
                {content.hero.subtitle}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Video Section */}
      <section className="mx-auto max-w-5xl px-6 pb-16 lg:px-8">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-gray-800 shadow-2xl">
          {content.hero.image && !content.videoUrl ? (
            <img
              src={content.hero.image}
              alt={content.hero.title}
              className="h-full w-full object-cover"
            />
          ) : content.videoUrl ? (
            <video
              src={content.videoUrl}
              controls
              className="h-full w-full object-cover"
            >
              Selaimesi ei tue video-elementtiä.
            </video>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div className="text-center">
                <svg
                  className="mx-auto h-16 w-16 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="mt-4 text-lg font-medium text-gray-400">
                  Video tulee tähän
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Aseta video-URL editorissa
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* CTA Button Section */}
      <section className="mx-auto max-w-5xl px-6 pb-24 lg:px-8">
        <div className="text-center">
          <AnalyticsLink
            siteId={siteId}
            href={content.hero.ctaLink}
            className="inline-block rounded-lg px-12 py-6 text-2xl font-bold text-white shadow-2xl transition-all hover:scale-105 hover:shadow-3xl"
            style={{ backgroundColor: primaryColor }}
            eventMetadata={{ location: "cta_button" }}
          >
            {content.hero.ctaText}
          </AnalyticsLink>
          <p className="mt-6 text-sm text-gray-400">
            Klikkaa nappia jatkaaksesi
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-gray-900">
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
