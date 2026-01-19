'use client';

import { useState } from 'react';
import { updatePageContent } from '@/app/actions/save-page';
import { useRouter } from 'next/navigation';

interface Hero {
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
}

interface Feature {
  icon: string;
  title: string;
  description: string;
}

interface Theme {
  primaryColor: string;
}

interface PageContent {
  hero: Hero;
  features: Feature[];
  theme: Theme;
}

interface EditorProps {
  siteId: string;
  pageId: string | null;
  siteSubdomain: string;
  initialContent: PageContent;
}

export default function Editor({
  siteId,
  pageId,
  siteSubdomain,
  initialContent,
}: EditorProps) {
  const router = useRouter();
  const [content, setContent] = useState<PageContent>(initialContent);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updatePageContent(siteId, content);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      setError('Tallennus epäonnistui. Yritä uudelleen.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateHero = (field: keyof Hero, value: string) => {
    setContent((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: value },
    }));
  };

  const updateTheme = (field: keyof Theme, value: string) => {
    setContent((prev) => ({
      ...prev,
      theme: { ...prev.theme, [field]: value },
    }));
  };

  const addFeature = () => {
    setContent((prev) => ({
      ...prev,
      features: [
        ...prev.features,
        { icon: '⭐', title: 'Uusi ominaisuus', description: 'Kuvaus' },
      ],
    }));
  };

  const removeFeature = (index: number) => {
    setContent((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const updateFeature = (
    index: number,
    field: keyof Feature,
    value: string
  ) => {
    setContent((prev) => ({
      ...prev,
      features: prev.features.map((feature, i) =>
        i === index ? { ...feature, [field]: value } : feature
      ),
    }));
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar - Form (40%) */}
      <div className="w-2/5 overflow-y-auto border-r border-gray-200 bg-white p-6">
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Takaisin dashboardiin
          </button>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Muokkaa sivustoa
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {siteSubdomain}.rascalpages.com
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-md bg-green-50 p-4">
            <p className="text-sm text-green-800">Muutokset tallennettu!</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Hero Section */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Hero-osa
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Otsikko
                </label>
                <input
                  type="text"
                  value={content.hero.title}
                  onChange={(e) => updateHero('title', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Alaotsikko
                </label>
                <textarea
                  value={content.hero.subtitle}
                  onChange={(e) => updateHero('subtitle', e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CTA-teksti
                </label>
                <input
                  type="text"
                  value={content.hero.cta}
                  onChange={(e) => updateHero('cta', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  CTA-linkki
                </label>
                <input
                  type="text"
                  value={content.hero.ctaLink}
                  onChange={(e) => updateHero('ctaLink', e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* Features Section */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Ominaisuudet
              </h2>
              <button
                onClick={addFeature}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                + Lisää
              </button>
            </div>
            <div className="space-y-4">
              {content.features.map((feature, index) => (
                <div
                  key={index}
                  className="rounded-md border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">
                      Ominaisuus {index + 1}
                    </span>
                    <button
                      onClick={() => removeFeature(index)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Poista
                    </button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Ikoni (emoji)
                      </label>
                      <input
                        type="text"
                        value={feature.icon}
                        onChange={(e) =>
                          updateFeature(index, 'icon', e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                        placeholder="⭐"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Otsikko
                      </label>
                      <input
                        type="text"
                        value={feature.title}
                        onChange={(e) =>
                          updateFeature(index, 'title', e.target.value)
                        }
                        className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">
                        Kuvaus
                      </label>
                      <textarea
                        value={feature.description}
                        onChange={(e) =>
                          updateFeature(index, 'description', e.target.value)
                        }
                        rows={2}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Theme Section */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Teema</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Pääväri
              </label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="color"
                  value={content.theme.primaryColor}
                  onChange={(e) => updateTheme('primaryColor', e.target.value)}
                  className="h-10 w-20 cursor-pointer rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={content.theme.primaryColor}
                  onChange={(e) => updateTheme('primaryColor', e.target.value)}
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="sticky bottom-0 bg-white pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Tallennetaan...' : 'Tallenna muutokset'}
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Preview (60%) */}
      <div className="w-3/5 overflow-y-auto bg-gray-100 p-8">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-lg border border-gray-300 bg-white shadow-lg">
            {/* Preview Content */}
            <div
              className="p-12"
              style={{
                '--primary-color': content.theme.primaryColor,
              } as React.CSSProperties}
            >
              {/* Hero Section Preview */}
              <div className="mb-16 text-center">
                <h1
                  className="mb-4 text-5xl font-bold"
                  style={{ color: content.theme.primaryColor }}
                >
                  {content.hero.title}
                </h1>
                <p className="mb-8 text-xl text-gray-600">
                  {content.hero.subtitle}
                </p>
                <a
                  href={content.hero.ctaLink}
                  className="inline-block rounded-lg px-6 py-3 text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: content.theme.primaryColor }}
                >
                  {content.hero.cta}
                </a>
              </div>

              {/* Features Section Preview */}
              <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                {content.features.map((feature, index) => (
                  <div key={index} className="text-center">
                    <div className="mb-4 text-4xl">{feature.icon}</div>
                    <h3 className="mb-2 text-xl font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
