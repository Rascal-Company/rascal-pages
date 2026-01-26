"use client";

import type { FeatureItem } from "@/src/lib/templates";
import type { SiteId } from "@/src/lib/types";

type FeaturesBlockProps = {
  content: FeatureItem[];
  theme: { primaryColor: string };
  siteId: SiteId;
  isPreview?: boolean;
};

export default function FeaturesBlock({ content }: FeaturesBlockProps) {
  if (!content || content.length === 0) return null;

  return (
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
          {content.map((feature, index) => (
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
  );
}
