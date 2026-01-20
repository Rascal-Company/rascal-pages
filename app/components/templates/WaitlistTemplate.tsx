'use client';

import { TemplateConfig } from '@/src/lib/templates';

interface WaitlistTemplateProps {
  content: TemplateConfig;
}

export default function WaitlistTemplate({ content }: WaitlistTemplateProps) {
  const primaryColor = content.theme?.primaryColor || '#8B5CF6';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle, ${primaryColor} 1px, transparent 1px)`,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Hero Section - Centered */}
      <section className="relative min-h-screen flex items-center justify-center px-6 py-24 sm:py-32">
        <div className="mx-auto max-w-2xl text-center">
          {content.hero.image && (
            <div className="mb-8">
              <img
                src={content.hero.image}
                alt={content.hero.title}
                className="mx-auto h-32 w-32 rounded-2xl object-cover shadow-xl"
              />
            </div>
          )}
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            {content.hero.title}
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600">
            {content.hero.subtitle}
          </p>

          {/* Waitlist Form */}
          <div className="mt-10">
            <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input
                type="email"
                required
                placeholder="Sähköpostiosoitteesi"
                className="flex-1 rounded-lg border border-gray-300 px-6 py-4 text-lg text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <button
                type="submit"
                className="rounded-lg px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                style={{ backgroundColor: primaryColor }}
              >
                {content.hero.ctaText}
              </button>
            </form>
            <p className="mt-4 text-sm text-gray-500">
              Liity odotuslistalle ja saat eksklusiivisen pääsyn heti kun julkaisemme.
            </p>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Ei roskapostia</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>Tietoturva</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
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
              &copy; {new Date().getFullYear()} Rascal Pages. Kaikki oikeudet pidätetään.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
