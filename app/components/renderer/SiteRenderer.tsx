'use client';

interface Content {
  hero?: {
    title?: string;
    subtitle?: string;
    cta?: string;
    ctaLink?: string;
  };
  features?: Array<{
    icon?: string;
    title?: string;
    description?: string;
  }>;
  theme?: {
    primaryColor?: string;
  };
}

interface SiteRendererProps {
  content: Content;
}

export default function SiteRenderer({ content }: SiteRendererProps) {
  const primaryColor = content.theme?.primaryColor || '#3B82F6';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      {content.hero && (
        <section
          className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white"
          style={{
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)`,
          }}
        >
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                {content.hero.title || 'Tervetuloa'}
              </h1>
              <p className="mt-6 text-lg leading-8 text-white/90">
                {content.hero.subtitle || 'Aloita matkasi tänään'}
              </p>
              {content.hero.cta && (
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <a
                    href={content.hero.ctaLink || '#'}
                    className="rounded-md bg-white px-6 py-3 text-base font-semibold text-gray-900 shadow-sm hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
                  >
                    {content.hero.cta}
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
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
                  {feature.icon && (
                    <div className="text-5xl mb-4">{feature.icon}</div>
                  )}
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title || 'Ominaisuus'}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description || 'Kuvaus ominaisuudesta'}
                  </p>
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
              &copy; {new Date().getFullYear()} Rascal Pages. Kaikki oikeudet pidätetään.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
